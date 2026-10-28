/* Intelligent Scrolling widget — exactly the four features in the IRB protocol:
 *   1. colored labeled markers next to the scrollbar (labels generated when the page loads)
 *   2. hover preview of a part (generated when the participant hovers)
 *   3. search box taking keywords or a sentence (sent when the participant submits)
 *   4. back button (no AI) returning to the previous scroll position
 *
 * Shape: the markers ARE the scrollbar. The bar is narrow and segmented by part, with a draggable
 * thumb showing the viewport, so it behaves like a scrollbar. Hovering it widens the bar to reveal
 * the labels; hovering one segment asks Claude for a fuller preview of that part. Back and search
 * live in a slim toolbar above the content so both stay discoverable without a click.
 *
 * Constraints respected here:
 *   - No storage of any kind: no localStorage, sessionStorage, IndexedDB, or cookies.
 *   - No analytics, no logging of what the participant does.
 *   - No global keyboard shortcuts, so the browser's own find (Ctrl/Cmd+F) is never intercepted.
 *   - Every AI call goes to /api/claude and carries only study content and the typed search text.
 */
(() => {
  'use strict';

  const CONFIG = {
    // PI DECISION: the protocol describes previews as generated on each hover. Caching them for the
    // fixed study content would not change what is sent to the AI, but it differs from that
    // description, so it is off until the PI confirms. Set to true to reuse a preview within a page.
    cachePreviews: false,
    hoverDelayMs: 320,   // only a deliberate hover asks for a preview
    maxResults: 6
  };

  // Colour says what KIND of content is at that position — text, a picture, code, a table. It is read
  // from the content itself, not generated, so it is always correct. Claude writes the label text.
  const TYPES = {
    text:  { color: '#5b8def', badge: '' },
    image: { color: '#d1467f', badge: 'img' },
    code:  { color: '#2e9e5b', badge: 'code' },
    table: { color: '#d9a406', badge: 'table' }
  };
  const typeOf = (part) => {
    const n = part.el;
    if (n.querySelector('img, svg, figure')) return 'image';
    if (n.querySelector('pre, code')) return 'code';
    if (n.querySelector('table')) return 'table';
    return 'text';
  };
  const colorOf = (part) => (TYPES[part.type] || TYPES.text).color;

  const el = (tag, attrs = {}, kids = []) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k === 'style') n.style.cssText = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else if (v !== null && v !== undefined && v !== false) n.setAttribute(k, v === true ? '' : v);
    }
    for (const c of [].concat(kids)) if (c != null && c !== false) n.append(c.nodeType ? c : document.createTextNode(String(c)));
    return n;
  };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  async function askClaude(task, payload) {
    const r = await fetch('/api/claude', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ task, payload })   // nothing else is ever sent
    });
    const data = await r.json().catch(() => null);
    if (!data || !data.ok) throw new Error((data && data.reason) || 'failed');
    return data.result;
  }

  class ScrollWidget {
    /** @param {HTMLElement} scroller scrolling content element
     *  @param {Array} parts [{id, el, heading, text}] in document order
     *  @param {'conversation'|'document'} kind
     *  @param {HTMLElement} toolbarHost where the back button and search box go */
    constructor(scroller, parts, kind, toolbarHost) {
      this.scroller = scroller;
      this.parts = parts;
      this.kind = kind;
      this.history = [];          // scroll positions, in memory only
      this.previews = new Map();  // cleared with the page; see CONFIG.cachePreviews
      this.inflight = new Set();
      this.hits = new Set();
      this.parts.forEach(p => { p.type = typeOf(p); });
      this.buildToolbar(toolbarHost);
      this.buildBar();
      this.loadLabels();
    }

    /* ---------- toolbar: back + search ---------- */
    buildToolbar(host) {
      this.toolbar = el('div', { class: 'isw-toolbar' }, [
        this.backBtn = el('button', {
          class: 'isw-back', type: 'button', disabled: true,
          title: 'Return to where you were before the last jump',
          onclick: () => this.goBack()
        }, [el('span', { class: 'isw-back-arrow', 'aria-hidden': 'true', text: '↩' }), 'Back']),
        el('form', { class: 'isw-searchform', onsubmit: (e) => { e.preventDefault(); this.runSearch(); } }, [
          this.input = el('input', {
            class: 'isw-input', type: 'search', placeholder: 'Search this page — keywords or a sentence',
            'aria-label': 'Search this page. Type keywords or a sentence.',
            autocomplete: 'off', spellcheck: 'false'
          }),
          this.searchBtn = el('button', { class: 'isw-go', type: 'submit' }, 'Search')
        ]),
        el('span', { class: 'isw-privacy', text: "Please don't type personal information." }),
        this.status = el('span', { class: 'isw-status', role: 'status', 'aria-live': 'polite' })
      ]);
      this.resultsPanel = el('div', { class: 'isw-results-panel', hidden: true });
      this.toolbar.append(this.resultsPanel);
      host.append(this.toolbar);
    }

    /* ---------- the labeled scrollbar ---------- */
    buildBar() {
      this.bar = el('div', {
        class: 'isw-bar', role: 'navigation', 'aria-label': 'Page map',
        onmouseenter: () => this.openBar(true),
        onmouseleave: () => this.openBar(false)
      }, [
        this.segs = el('div', { class: 'isw-segs' }),
        this.thumb = el('div', { class: 'isw-thumb', 'aria-hidden': 'true' })
      ]);
      this.preview = el('div', { class: 'isw-preview', hidden: true, role: 'tooltip' });
      document.body.append(this.preview);
      this.scroller.parentElement.append(this.bar);

      // drag the thumb, and click the bar, like an ordinary scrollbar
      this.thumb.addEventListener('mousedown', (e) => this.startDrag(e));
      this.bar.addEventListener('mousedown', (e) => {
        if (e.target.closest('.isw-seg') || e.target === this.thumb) return;
        this.scrubTo(e.clientY, true);
        this.startDrag(e, true);
      });

      this.selPop = el('div', { class: 'isw-selpop', hidden: true });
      document.body.append(this.selPop);
      this.onSelect = () => this.onSelection();
      this.scroller.addEventListener('mouseup', this.onSelect);
      this.hideSel = (e) => { if (!e.target.closest('.isw-selpop')) this.selPop.hidden = true; };
      document.addEventListener('mousedown', this.hideSel);

      this.onScroll = () => this.onScrollTick();
      this.scroller.addEventListener('scroll', this.onScroll, { passive: true });
      this.resizeObs = new ResizeObserver(() => this.layout());
      this.resizeObs.observe(this.scroller);
      this.lastSettled = this.scroller.scrollTop;
      this.renderSegments();
    }

    // Selecting a phrase offers it to the search box — the same feature, reached by pointing.
    onSelection() {
      setTimeout(() => {
        const sel = window.getSelection();
        const text = sel && sel.toString().trim();
        if (!text || text.length < 3 || text.length > 160 || !sel.rangeCount) { this.selPop.hidden = true; return; }
        const r = sel.getRangeAt(0).getBoundingClientRect();
        this.selPop.textContent = '';
        this.selPop.append(el('button', {
          class: 'isw-selbtn', type: 'button',
          onclick: () => { this.input.value = text; this.selPop.hidden = true; this.runSearch(); }
        }, [el('span', { 'aria-hidden': 'true', text: '⌕' }), ' Search for this']));
        this.selPop.hidden = false;
        this.selPop.style.left = clamp(r.left + r.width / 2 - this.selPop.offsetWidth / 2, 8, window.innerWidth - this.selPop.offsetWidth - 8) + 'px';
        this.selPop.style.top = Math.max(8, r.top - this.selPop.offsetHeight - 8) + 'px';
      }, 10);
    }

    destroy() {
      this.scroller.removeEventListener('mouseup', this.onSelect);
      document.removeEventListener('mousedown', this.hideSel);
      this.selPop.remove();
      this.scroller.removeEventListener('scroll', this.onScroll);
      this.resizeObs.disconnect();
      window.removeEventListener('mousemove', this.dragMove);
      window.removeEventListener('mouseup', this.dragEnd);
      this.bar.remove();
      this.toolbar.remove();
      this.preview.remove();
    }

    openBar(open) {
      clearTimeout(this.closeTimer);
      if (open) { this.bar.classList.add('isw-open'); return; }
      this.closeTimer = setTimeout(() => {
        this.bar.classList.remove('isw-open');
        this.preview.hidden = true;
        this.hoverPart = null;
      }, 180);
    }

    renderSegments() {
      this.segs.textContent = '';
      this.segEls = this.parts.map((p, i) => {
        const seg = el('button', {
          class: 'isw-seg' + (p.label ? '' : ' isw-seg-wait') + (this.hits.has(p.id) ? ' isw-hit' : ''),
          type: 'button',
          'aria-label': p.label ? `Go to: ${p.label}` : `Part ${i + 1}, label loading`,
          onclick: () => this.jumpTo(p),
          onmouseenter: () => this.hoverSeg(p, seg),
          onmouseleave: () => this.leaveSeg(),
          onfocus: () => { this.openBar(true); this.hoverSeg(p, seg); },
          onblur: () => { this.leaveSeg(); this.openBar(false); }
        }, [
          el('span', { class: 'isw-stripe', style: `background:${colorOf(p)}`, 'aria-hidden': 'true' }),
          el('span', { class: 'isw-seglabel' }, [
            TYPES[p.type].badge ? el('span', { class: 'isw-badge isw-badge-' + p.type, text: TYPES[p.type].badge }) : null,
            p.label || ''
          ])
        ]);
        seg._part = p;
        return seg;
      });
      this.segEls.forEach(s => this.segs.append(s));
      this.layout();
    }

    offsetOf(node) {
      return node.getBoundingClientRect().top - this.scroller.getBoundingClientRect().top + this.scroller.scrollTop;
    }

    // Each segment covers the same share of the bar as its part covers of the document, so the bar
    // is a true map of the page rather than an evenly spaced list.
    layout() {
      if (!this.segEls || !this.segEls.length) return;
      const total = Math.max(1, this.scroller.scrollHeight);
      const h = this.segs.clientHeight;
      const MIN = 15;
      const tops = this.parts.map(p => this.offsetOf(p.el));
      this.segEls.forEach((seg, i) => {
        const start = tops[i];
        const end = i + 1 < tops.length ? tops[i + 1] : total;
        const top = (start / total) * h;
        const height = Math.max(MIN, ((end - start) / total) * h);
        seg.style.top = clamp(top, 0, Math.max(0, h - MIN)) + 'px';
        seg.style.height = Math.min(height, Math.max(MIN, h - top)) + 'px';
      });
      this.updateThumb();
    }

    updateThumb() {
      const total = Math.max(1, this.scroller.scrollHeight);
      const h = this.segs.clientHeight;
      const view = this.scroller.clientHeight;
      this.thumb.style.top = (this.scroller.scrollTop / total) * h + 'px';
      this.thumb.style.height = Math.max(22, (view / total) * h) + 'px';
      if (!this.segEls) return;
      const top = this.scroller.scrollTop, bottom = top + view;
      this.segEls.forEach(seg => {
        const y = this.offsetOf(seg._part.el);
        seg.classList.toggle('isw-here', y >= top - 40 && y < bottom);
      });
    }

    /* dragging the thumb scrolls the page */
    startDrag(e, already) {
      e.preventDefault();
      this.bar.classList.add('isw-dragging');
      if (!already) this.pushHistory(this.scroller.scrollTop);
      this.dragMove = (ev) => this.scrubTo(ev.clientY, false);
      this.dragEnd = () => {
        this.bar.classList.remove('isw-dragging');
        window.removeEventListener('mousemove', this.dragMove);
        window.removeEventListener('mouseup', this.dragEnd);
        this.lastSettled = this.scroller.scrollTop;
      };
      window.addEventListener('mousemove', this.dragMove);
      window.addEventListener('mouseup', this.dragEnd);
    }

    scrubTo(clientY, record) {
      const r = this.segs.getBoundingClientRect();
      const frac = clamp((clientY - r.top) / Math.max(1, r.height), 0, 1);
      if (record) this.pushHistory(this.scroller.scrollTop);
      this.suppress = true;
      this.scroller.scrollTop = frac * this.scroller.scrollHeight - this.scroller.clientHeight / 2;
      clearTimeout(this.unsuppress);
      this.unsuppress = setTimeout(() => { this.suppress = false; this.lastSettled = this.scroller.scrollTop; }, 120);
    }

    /* ---------- feature 1: labels ---------- */
    async loadLabels() {
      this.setStatus('Reading the page…', 'busy');
      try {
        const sections = this.parts.map(p => ({ id: p.id, text: (p.heading ? p.heading + '. ' : '') + p.text.slice(0, 900) }));
        const out = await askClaude('labels', { kind: this.kind, sections });
        const byId = new Map((Array.isArray(out) ? out : []).map(r => [String(r.id), r]));
        this.parts.forEach(p => {
          const r = byId.get(p.id);
          if (r && r.label) p.label = String(r.label).slice(0, 48);
        });
        this.setStatus('');
      } catch {
        // Degrade honestly rather than leaving an unusable bar: a document part falls back to its own
        // heading, which is already visible on the page, and a conversation part to its number.
        this.parts.forEach((p, i) => { if (!p.label) { p.label = p.heading || `Part ${i + 1}`; p.fallback = true; } });
        this.setStatus("The AI didn't respond. You can keep scrolling or try again.", 'error', () => this.loadLabels());
      }
      this.renderSegments();
    }

    /* ---------- feature 2: hover preview ---------- */
    hoverSeg(part, seg) {
      clearTimeout(this.hoverTimer);
      clearTimeout(this.hideTimer);
      this.hoverPart = part;
      const cached = CONFIG.cachePreviews ? this.previews.get(part.id) : null;
      if (cached) return this.showPreview(part, seg, cached);
      this.hoverTimer = setTimeout(() => this.fetchPreview(part, seg), CONFIG.hoverDelayMs);
    }

    leaveSeg() {
      clearTimeout(this.hoverTimer);
      this.hideTimer = setTimeout(() => { this.preview.hidden = true; this.hoverPart = null; }, 160);
    }

    async fetchPreview(part, seg) {
      if (this.inflight.has(part.id)) return;
      this.inflight.add(part.id);
      this.showPreview(part, seg, { loading: true });
      try {
        const out = await askClaude('preview', { kind: this.kind, heading: part.heading || '', text: part.text.slice(0, 6000) });
        const data = { summary: String(out && out.summary || ''), points: Array.isArray(out && out.points) ? out.points.slice(0, 4) : [] };
        if (CONFIG.cachePreviews) this.previews.set(part.id, data);
        if (this.hoverPart === part) this.showPreview(part, seg, data);
      } catch {
        if (this.hoverPart === part) this.showPreview(part, seg, { error: true });
      } finally {
        this.inflight.delete(part.id);
      }
    }

    showPreview(part, seg, data) {
      clearTimeout(this.hideTimer);
      const body = data.loading
        ? [el('div', { class: 'isw-pv-loading', text: 'Looking at this part…' })]
        : data.error
          ? [el('div', { class: 'isw-pv-error', text: "The AI didn't respond. You can keep scrolling or try again." })]
          : [
            el('div', { class: 'isw-pv-head' }, [
              el('span', { class: 'isw-pv-dot', style: `background:${colorOf(part)}`, 'aria-hidden': 'true' }),
              TYPES[part.type].badge ? el('span', { class: 'isw-pv-badge', text: TYPES[part.type].badge }) : null,
              part.label || part.heading || ''
            ]),
            el('p', { class: 'isw-pv-text', text: data.summary }),
            data.points && data.points.length
              ? el('ul', { class: 'isw-pv-points' }, data.points.map(pt => el('li', { text: String(pt) })))
              : null
          ];
      this.preview.textContent = '';
      body.filter(Boolean).forEach(n => this.preview.append(n));
      this.preview.hidden = false;
      const r = seg.getBoundingClientRect();
      const barR = this.bar.getBoundingClientRect();
      this.preview.style.right = (window.innerWidth - barR.left + 10) + 'px';
      this.preview.style.top = clamp(r.top + r.height / 2 - this.preview.offsetHeight / 2, 8, Math.max(8, window.innerHeight - this.preview.offsetHeight - 8)) + 'px';
    }

    /* ---------- feature 3: search ---------- */
    async runSearch() {
      const q = this.input.value.trim();
      if (!q) { this.clearHits(); this.setStatus(''); this.resultsPanel.hidden = true; return; }
      this.searchBtn.disabled = true;
      this.setStatus('Searching…', 'busy');
      try {
        const sections = this.parts.map(p => ({ id: p.id, text: (p.heading ? p.heading + '. ' : '') + p.text.slice(0, 900) }));
        const out = await askClaude('search', { kind: this.kind, query: q, sections });
        const list = (Array.isArray(out) ? out : []).slice(0, CONFIG.maxResults);
        this.showResults(list.map(r => ({ part: this.parts.find(p => p.id === String(r.id)), why: String(r.why || '') })).filter(x => x.part));
      } catch {
        this.clearHits();
        this.setStatus("The AI didn't respond. You can keep scrolling or try again.", 'error', () => this.runSearch());
      } finally {
        this.searchBtn.disabled = false;
      }
    }

    showResults(results) {
      this.hits = new Set(results.map(r => r.part.id));
      if (this.segEls) this.segEls.forEach(s => s.classList.toggle('isw-hit', this.hits.has(s._part.id)));
      this.setStatus(results.length ? `${results.length} result${results.length === 1 ? '' : 's'}` : 'No matching parts.');
      this.resultsPanel.textContent = '';
      this.resultsPanel.hidden = results.length === 0;
      if (!results.length) return;
      results.forEach((r, i) => {
        this.resultsPanel.append(el('button', {
          class: 'isw-result', type: 'button', onclick: () => { this.jumpTo(r.part); this.resultsPanel.hidden = true; }
        }, [
          el('span', { class: 'isw-stripe', style: `background:${colorOf(r.part)}`, 'aria-hidden': 'true' }),
          el('span', {}, [
            el('span', { class: 'isw-result-label', text: r.part.label || r.part.heading || `Part ${i + 1}` }),
            r.why ? el('span', { class: 'isw-result-why', text: r.why }) : null
          ])
        ]));
      });
      this.resultsPanel.append(el('button', {
        class: 'isw-clear', type: 'button',
        onclick: () => { this.input.value = ''; this.clearHits(); this.setStatus(''); this.resultsPanel.hidden = true; }
      }, 'Clear results'));
    }

    clearHits() {
      this.hits = new Set();
      if (this.segEls) this.segEls.forEach(s => s.classList.remove('isw-hit'));
    }

    setStatus(text, kind, retry) {
      this.status.textContent = '';
      this.status.className = 'isw-status' + (kind ? ' isw-' + kind : '');
      if (text) this.status.append(el('span', { text }));
      if (retry) this.status.append(el('button', { class: 'isw-retry', type: 'button', onclick: retry }, 'Try again'));
    }

    /* ---------- feature 4: back ---------- */
    jumpTo(part) {
      this.pushHistory(this.scroller.scrollTop);
      this.scrollTo(this.offsetOf(part.el) - 24);
      this.flash(part.el);
      this.preview.hidden = true;
    }

    pushHistory(y) {
      const last = this.history[this.history.length - 1];
      if (last != null && Math.abs(last - y) < 24) return;
      this.history.push(y);
      if (this.history.length > 40) this.history.shift();
      this.updateBack();
    }

    goBack() {
      const y = this.history.pop();
      if (y == null) return;
      this.scrollTo(y);
      this.updateBack();
    }

    updateBack() { this.backBtn.disabled = this.history.length === 0; }

    scrollTo(y) {
      this.suppress = true;
      const to = clamp(y, 0, Math.max(0, this.scroller.scrollHeight - this.scroller.clientHeight));
      const from = this.scroller.scrollTop, t0 = performance.now(), ms = 380;
      clearInterval(this.anim);
      this.anim = setInterval(() => {
        const t = Math.min(1, (performance.now() - t0) / ms);
        this.scroller.scrollTop = from + (to - from) * (1 - Math.pow(1 - t, 3));
        if (t >= 1) {
          clearInterval(this.anim);
          this.suppress = false;
          this.lastSettled = this.scroller.scrollTop;
          this.updateThumb();
        }
      }, 16);
    }

    onScrollTick() {
      this.updateThumb();
      if (this.suppress) return;
      clearTimeout(this.settleTimer);
      this.settleTimer = setTimeout(() => {
        const y = this.scroller.scrollTop;
        if (Math.abs(y - this.lastSettled) > this.scroller.clientHeight * 2) this.pushHistory(this.lastSettled);
        this.lastSettled = y;
      }, 320);
    }

    flash(node) {
      document.querySelectorAll('.isw-flash').forEach(n => n.classList.remove('isw-flash'));
      node.classList.add('isw-flash');
      setTimeout(() => node.classList.remove('isw-flash'), 2400);
    }
  }

  window.ScrollWidget = ScrollWidget;
  window.ScrollWidget.CONFIG = CONFIG;
})();
