/* Intelligent Scrolling widget — exactly the four features in the IRB protocol:
 *   1. labeled markers next to the scrollbar (labels generated when the page loads)
 *   2. hover preview of a part (generated when the participant hovers)
 *   3. search box taking keywords or a sentence (sent when the participant submits)
 *   4. back button (no AI) returning to a previous scroll position
 *
 * Shape (revised after the first round of user tests):
 *   - A narrow RAIL replaces the native scrollbar. It is a proportional map of the page with a
 *     draggable thumb, so it still behaves like a scrollbar. Ticks are neutral; no colors or badges.
 *   - An OUTLINE panel holds the AI labels as a readable list. It opens only when the participant
 *     clicks the toggle at the top of the rail, and closes only with the × in the panel — never on
 *     hover. While it is open, the rail is hidden and the outline takes its place.
 *   - Hovering a tick or an outline item shows a short preview: one line on what is there, what
 *     kind of content it holds, what comes just before, and — if a search is active — whether it
 *     matches the search.
 *   - BACK and SEARCH live on the right of the page's own title bar, so they read as belonging to
 *     this page, not to the browser or the whole site.
 *   - A spot is saved for Back when the participant stays on it for 5 seconds, or jumps away from it
 *     with the outline, rail, or search results. Arriving somewhere by a jump also counts as a stop.
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
    // PI DECISION: the protocol describes previews as generated on each hover. Set to true to reuse
    // a preview within a page (same part, same search); it would not change what is sent to the AI.
    cachePreviews: false,
    hoverDelayMs: 320,     // only a deliberate hover asks for a preview
    maxResults: 6,
    dwellMs: 5000,         // staying this long on a spot saves it for Back
    leaveFraction: 0.5,    // moving more than this share of the window away counts as leaving
    outlineWidth: 300,     // px; the page narrows by this much while the outline is open
    railWidth: 34
  };

  // Content kind is read from the page itself, never from the AI. It appears only in the preview.
  const KIND_LABEL = { text: '', image: 'Picture', code: 'Code', table: 'Table' };
  const typeOf = (part) => {
    const n = part.el;
    if (n.querySelector('svg, img, figure')) return 'image';
    if (n.querySelector('pre')) return 'code';
    if (n.querySelector('table')) return 'table';
    return 'text';
  };

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
    /** @param {HTMLElement} scroller scrolling content element (absolutely positioned in its parent)
     *  @param {Array} parts [{id, el, heading, text}] in document order
     *  @param {'conversation'|'document'} kind
     *  @param {HTMLElement} headerHost the right side of the page's title bar: Back and search go here */
    constructor(scroller, parts, kind, headerHost) {
      this.scroller = scroller;
      this.wrap = scroller.parentElement;
      this.parts = parts;
      this.kind = kind;
      this.history = [];          // saved scroll positions, in memory only
      this.stopY = null;          // the spot the participant is currently "stopped" on, if any
      this.previews = new Map();
      this.inflight = new Set();
      this.hits = new Set();
      this.query = '';            // the active search, also given to previews
      this.expanded = false;
      this.parts.forEach(p => { p.type = typeOf(p); });
      // The rail replaces the browser's own scrollbar; showing both gives two position markers
      // that disagree, so the native one is hidden while the widget is on the page.
      this.scroller.classList.add('isw-native-off');

      this.buildHeader(headerHost);
      this.buildRail();
      this.buildOutline();
      this.preview = el('div', { class: 'isw-preview', hidden: true, role: 'tooltip' });
      document.body.append(this.preview);
      this.bindPage();
      this.render();
      this.loadLabels();
      this.armDwell();
    }

    /* ---------- title bar: back + search ---------- */
    buildHeader(host) {
      this.headerHost = host;
      const example = this.kind === 'conversation'
        ? 'Search this chat — try "how to interview drivers"'
        : 'Search this article — try "what residents thought"';
      this.tools = el('div', { class: 'isw-tools' }, [
        this.status = el('span', { class: 'isw-status', role: 'status', 'aria-live': 'polite' }),
        this.backBtn = el('button', {
          class: 'isw-back', type: 'button', disabled: true,
          title: 'Go back to the last spot you stopped on or jumped from (on this page)',
          onclick: () => this.goBack()
        }, [el('span', { class: 'isw-back-arrow', 'aria-hidden': 'true', text: '↩' }), 'Previous spot']),
        this.form = el('form', { class: 'isw-searchform', onsubmit: (e) => { e.preventDefault(); this.runSearch(); } }, [
          this.input = el('input', {
            class: 'isw-input', type: 'search', placeholder: example,
            title: 'Type words or a whole question. It finds parts with the same meaning, even if they use different words.',
            'aria-label': 'Search this page. Type words or a whole question; it finds matching meaning, not just matching words.',
            autocomplete: 'off', spellcheck: 'false'
          }),
          this.searchBtn = el('button', { class: 'isw-go', type: 'submit' }, 'Search'),
          this.resultsPanel = el('div', { class: 'isw-results-panel', hidden: true })
        ])
      ]);
      host.append(this.tools);
    }

    /* ---------- the rail: a proportional scrollbar with neutral ticks ---------- */
    buildRail() {
      this.rail = el('div', { class: 'isw-rail' }, [
        this.toggleBtn = el('button', {
          class: 'isw-toggle', type: 'button', 'aria-expanded': 'false',
          title: 'Show the outline', 'aria-label': 'Show the outline',
          onclick: () => this.setExpanded(!this.expanded)
        }, [el('span', { class: 'isw-toggle-icon', 'aria-hidden': 'true' })]),
        this.track = el('div', { class: 'isw-track' }, [
          this.segs = el('div', { class: 'isw-segs', role: 'navigation', 'aria-label': 'Page map' }),
          this.thumb = el('div', { class: 'isw-thumb', 'aria-hidden': 'true' })
        ])
      ]);
      this.wrap.append(this.rail);

      this.thumb.addEventListener('mousedown', (e) => this.startDrag(e));
      this.track.addEventListener('mousedown', (e) => {
        if (e.target.closest('.isw-seg') || e.target === this.thumb) return;
        this.scrubTo(e.clientY);
        this.startDrag(e);
      });
    }

    /* ---------- the outline: the AI labels as a list, opened by click ---------- */
    buildOutline() {
      this.outline = el('div', { class: 'isw-outline', hidden: true, role: 'navigation', 'aria-label': 'Page outline' }, [
        el('div', { class: 'isw-outline-head' }, [
          el('div', {}, [
            el('div', { class: 'isw-outline-title', text: this.kind === 'conversation' ? 'Outline of this chat' : 'Outline of this article' }),
            this.outlineSub = el('div', { class: 'isw-outline-sub', text: 'Labels written by AI' })
          ]),
          this.closeBtn = el('button', {
            class: 'isw-close', type: 'button', title: 'Close the outline', 'aria-label': 'Close the outline',
            onclick: () => this.setExpanded(false)
          }, '×')
        ]),
        this.list = el('ol', { class: 'isw-list' })
      ]);
      this.outline.style.width = CONFIG.outlineWidth + 'px';
      this.outline.style.right = '0px';   // the outline replaces the rail while it is open
      this.outline.addEventListener('mouseenter', () => { this.overOutline = true; });
      this.outline.addEventListener('mouseleave', () => { this.overOutline = false; });
      this.wrap.append(this.outline);
    }

    setExpanded(open) {
      this.expanded = open;
      this.outline.hidden = !open;
      this.rail.hidden = open;      // the thin bar of marks goes away while the outline is open
      this.toggleBtn.setAttribute('aria-expanded', String(open));
      this.toggleBtn.classList.toggle('isw-toggle-on', open);
      const t = open ? 'Hide the outline' : 'Show the outline';
      this.toggleBtn.title = t; this.toggleBtn.setAttribute('aria-label', t);
      // Narrow the page instead of covering it, keeping the reading position steady.
      const anchor = this.scroller.scrollTop / Math.max(1, this.scroller.scrollHeight);
      this.scroller.style.right = open ? CONFIG.outlineWidth + 'px' : '';
      this.suppress = true;
      this.scroller.scrollTop = anchor * this.scroller.scrollHeight;
      requestAnimationFrame(() => { this.suppress = false; this.layout(); this.revealCurrent(true); });
      this.hidePreview();
      // keep keyboard focus on a visible control
      (open ? this.closeBtn : this.toggleBtn).focus({ preventScroll: true });
    }

    /* ---------- page listeners ---------- */
    bindPage() {
      this.selPop = el('div', { class: 'isw-selpop', hidden: true });
      document.body.append(this.selPop);
      this.onSelect = () => this.onSelection();
      this.scroller.addEventListener('mouseup', this.onSelect);
      this.hideSel = (e) => {
        if (!e.target.closest('.isw-selpop')) this.selPop.hidden = true;
        if (!e.target.closest('.isw-searchform')) this.resultsPanel.hidden = true;
      };
      document.addEventListener('mousedown', this.hideSel);

      this.onScroll = () => this.onScrollTick();
      this.scroller.addEventListener('scroll', this.onScroll, { passive: true });
      this.resizeObs = new ResizeObserver(() => this.layout());
      this.resizeObs.observe(this.scroller);
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
      clearTimeout(this.dwellTimer); clearTimeout(this.hoverTimer); clearTimeout(this.hideTimer);
      clearInterval(this.anim);
      this.scroller.removeEventListener('mouseup', this.onSelect);
      this.scroller.removeEventListener('scroll', this.onScroll);
      document.removeEventListener('mousedown', this.hideSel);
      window.removeEventListener('mousemove', this.dragMove);
      window.removeEventListener('mouseup', this.dragEnd);
      this.resizeObs.disconnect();
      this.scroller.style.right = '';
      this.scroller.classList.remove('isw-native-off');
      [this.selPop, this.rail, this.outline, this.tools, this.preview].forEach(n => n.remove());
    }

    /* ---------- rendering ---------- */
    render() {
      this.segs.textContent = '';
      this.list.textContent = '';
      const handlers = (p, node) => ({
        onclick: () => this.jumpTo(p),
        onmouseenter: () => this.hover(p, node()),
        onmouseleave: () => this.unhover(),
        onfocus: () => this.hover(p, node()),
        onblur: () => this.unhover()
      });

      this.segEls = this.parts.map((p, i) => {
        let seg;
        seg = el('button', Object.assign({
          class: 'isw-seg', type: 'button',
          'aria-label': p.label ? `Go to: ${p.label}` : `Go to part ${i + 1}`
        }, handlers(p, () => seg)), [el('span', { class: 'isw-tick', 'aria-hidden': 'true' })]);
        seg._part = p;
        this.segs.append(seg);
        return seg;
      });

      this.itemEls = this.parts.map((p, i) => {
        let item;
        item = el('button', Object.assign({ class: 'isw-item' + (p.label ? '' : ' isw-item-wait'), type: 'button' }, handlers(p, () => item)), [
          el('span', { class: 'isw-item-num', text: String(i + 1) }),
          el('span', { class: 'isw-item-label', text: p.label || 'Loading label…' })
        ]);
        item._part = p;
        this.list.append(el('li', {}, [item]));
        return item;
      });

      this.markHits();
      this.layout();
    }

    offsetOf(node) {
      return node.getBoundingClientRect().top - this.scroller.getBoundingClientRect().top + this.scroller.scrollTop;
    }

    // Each tick covers the same share of the rail as its part covers of the page.
    layout() {
      if (!this.segEls || !this.segEls.length) return;
      const total = Math.max(1, this.scroller.scrollHeight);
      const h = this.segs.clientHeight;
      const MIN = 6;
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
      this.parts.forEach((p, i) => {
        const y = this.offsetOf(p.el);
        const next = i + 1 < this.parts.length ? this.offsetOf(this.parts[i + 1].el) : this.scroller.scrollHeight;
        const here = next > top + 40 && y < bottom - 40;
        this.segEls[i].classList.toggle('isw-here', here);
        this.itemEls[i].classList.toggle('isw-here', here);
      });
      this.revealCurrent(false);
    }

    // Keep the current item visible in the outline, unless the participant is using the outline.
    revealCurrent(force) {
      if (!this.expanded || (this.overOutline && !force)) return;
      const cur = this.itemEls.find(n => n.classList.contains('isw-here'));
      if (!cur) return;
      const box = this.list, r = cur.offsetTop, hgt = cur.offsetHeight;
      if (r < box.scrollTop + 8 || r + hgt > box.scrollTop + box.clientHeight - 8) {
        box.scrollTop = r - box.clientHeight / 3;
      }
    }

    markHits() {
      const all = (this.segEls || []).concat(this.itemEls || []);
      all.forEach(n => n.classList.toggle('isw-hit', this.hits.has(n._part.id)));
    }

    /* dragging the thumb scrolls the page, like an ordinary scrollbar */
    startDrag(e) {
      e.preventDefault();
      this.rail.classList.add('isw-dragging');
      this.dragMove = (ev) => this.scrubTo(ev.clientY);
      this.dragEnd = () => {
        this.rail.classList.remove('isw-dragging');
        window.removeEventListener('mousemove', this.dragMove);
        window.removeEventListener('mouseup', this.dragEnd);
      };
      window.addEventListener('mousemove', this.dragMove);
      window.addEventListener('mouseup', this.dragEnd);
    }

    scrubTo(clientY) {
      const r = this.segs.getBoundingClientRect();
      const frac = clamp((clientY - r.top) / Math.max(1, r.height), 0, 1);
      this.scroller.scrollTop = frac * this.scroller.scrollHeight - this.scroller.clientHeight / 2;
    }

    /* ---------- feature 1: labels ---------- */
    async loadLabels() {
      this.setStatus('Loading labels… about 10 seconds', 'busy');
      this.outlineSub.textContent = 'Loading labels… about 10 seconds';
      try {
        const sections = this.parts.map(p => ({ id: p.id, text: (p.heading ? p.heading + '. ' : '') + p.text.slice(0, 1150) }));
        const out = await askClaude('labels', { kind: this.kind, sections });
        const byId = new Map((Array.isArray(out) ? out : []).map(r => [String(r.id), r]));
        this.parts.forEach(p => {
          const r = byId.get(p.id);
          if (r && r.label) { p.label = String(r.label).slice(0, 60); p.fallback = false; }
        });
        this.setStatus('');
        this.outlineSub.textContent = 'Labels written by AI';
      } catch {
        // Degrade honestly: a document part falls back to its own heading, already visible on the
        // page, and a conversation part to its number.
        this.parts.forEach((p, i) => { if (!p.label) { p.label = p.heading || `Part ${i + 1}`; p.fallback = true; } });
        this.setStatus("The AI didn't respond.", 'error', () => this.loadLabels());
        this.outlineSub.textContent = "AI labels didn't load";
      }
      this.render();
    }

    /* ---------- feature 2: hover preview ---------- */
    previewKey(part) { return part.id + '|' + this.query; }

    hover(part, anchor) {
      clearTimeout(this.hoverTimer);
      clearTimeout(this.hideTimer);
      this.hoverPart = part;
      const cached = CONFIG.cachePreviews ? this.previews.get(this.previewKey(part)) : null;
      if (cached) return this.showPreview(part, anchor, cached);
      this.hoverTimer = setTimeout(() => this.fetchPreview(part, anchor), CONFIG.hoverDelayMs);
    }

    unhover() {
      clearTimeout(this.hoverTimer);
      this.hideTimer = setTimeout(() => this.hidePreview(), 160);
    }

    hidePreview() { this.preview.hidden = true; this.hoverPart = null; }

    async fetchPreview(part, anchor) {
      const key = this.previewKey(part);
      if (this.inflight.has(key)) return;
      this.inflight.add(key);
      this.showPreview(part, anchor, { loading: true });
      try {
        const out = await askClaude('preview', {
          kind: this.kind, heading: part.heading || '', text: part.text.slice(0, 6000), query: this.query
        });
        const data = {
          here: String(out && (out.here || out.summary) || ''),
          match: out && out.match ? String(out.match) : ''
        };
        if (CONFIG.cachePreviews) this.previews.set(key, data);
        if (this.hoverPart === part) this.showPreview(part, anchor, data);
      } catch {
        if (this.hoverPart === part) this.showPreview(part, anchor, { error: true });
      } finally {
        this.inflight.delete(key);
      }
    }

    showPreview(part, anchor, data) {
      clearTimeout(this.hideTimer);
      const i = this.parts.indexOf(part);
      const prev = i > 0 ? this.parts[i - 1] : null;
      const kindLabel = KIND_LABEL[part.type];

      const body = [
        el('div', { class: 'isw-pv-head' }, [
          el('span', { class: 'isw-pv-title', text: part.label || part.heading || `Part ${i + 1}` }),
          kindLabel ? el('span', { class: 'isw-pv-kind', text: kindLabel }) : null
        ])
      ];
      if (data.loading) {
        body.push(el('div', { class: 'isw-pv-loading' }, [el('span', { class: 'isw-spin', 'aria-hidden': 'true' }), 'Loading preview… usually 3–5 seconds']));
      } else if (data.error) {
        body.push(el('div', { class: 'isw-pv-error', text: "The AI didn't respond. Move away and hover again to retry." }));
      } else {
        if (data.here) body.push(el('p', { class: 'isw-pv-text', text: data.here }));
        if (data.match) {
          const verdict = /^yes/i.test(data.match) ? 'yes' : /^partly/i.test(data.match) ? 'partly' : 'no';
          body.push(el('p', { class: 'isw-pv-match isw-pv-match-' + verdict }, [
            el('span', { class: 'isw-pv-match-q', text: `Your search “${this.query}”: ` }), data.match
          ]));
        }
      }
      if (prev && (prev.label || prev.heading)) {
        body.push(el('p', { class: 'isw-pv-before' }, [el('span', { text: 'Just before: ' }), prev.label || prev.heading]));
      }

      this.preview.textContent = '';
      body.filter(Boolean).forEach(n => this.preview.append(n));
      this.preview.hidden = false;
      const r = anchor.getBoundingClientRect();
      this.preview.style.right = (window.innerWidth - r.left + 10) + 'px';
      this.preview.style.top = clamp(r.top + r.height / 2 - this.preview.offsetHeight / 2, 8, Math.max(8, window.innerHeight - this.preview.offsetHeight - 8)) + 'px';
    }

    /* ---------- feature 3: search ---------- */
    async runSearch() {
      const q = this.input.value.trim();
      if (!q) { this.clearSearch(); return; }
      this.searchBtn.disabled = true;
      this.setStatus('Searching… about 4 seconds', 'busy');
      try {
        const sections = this.parts.map(p => ({ id: p.id, text: (p.heading ? p.heading + '. ' : '') + p.text.slice(0, 1150) }));
        const out = await askClaude('search', { kind: this.kind, query: q, sections });
        const list = (Array.isArray(out) ? out : []).slice(0, CONFIG.maxResults);
        this.query = q;
        this.showResults(list.map(r => ({ part: this.parts.find(p => p.id === String(r.id)), why: String(r.why || '') })).filter(x => x.part));
      } catch {
        this.hits = new Set(); this.markHits();
        this.setStatus("The AI didn't respond.", 'error', () => this.runSearch());
      } finally {
        this.searchBtn.disabled = false;
      }
    }

    showResults(results) {
      this.hits = new Set(results.map(r => r.part.id));
      this.markHits();
      this.setStatus(results.length ? `${results.length} match${results.length === 1 ? '' : 'es'}` : 'No matching parts');
      this.resultsPanel.textContent = '';
      this.resultsPanel.hidden = false;
      if (!results.length) {
        this.resultsPanel.append(el('div', { class: 'isw-noresult', text: 'Nothing on this page seems to match. Try other words.' }));
      }
      results.forEach((r) => {
        this.resultsPanel.append(el('button', {
          class: 'isw-result', type: 'button', onclick: () => { this.jumpTo(r.part); this.resultsPanel.hidden = true; }
        }, [
          el('span', { class: 'isw-result-label', text: r.part.label || r.part.heading || `Part ${this.parts.indexOf(r.part) + 1}` }),
          r.why ? el('span', { class: 'isw-result-why', text: r.why }) : null
        ]));
      });
      this.resultsPanel.append(el('button', { class: 'isw-clear', type: 'button', onclick: () => this.clearSearch() }, 'Clear search'));
    }

    clearSearch() {
      this.input.value = '';
      this.query = '';
      this.hits = new Set();
      this.markHits();
      this.setStatus('');
      this.resultsPanel.hidden = true;
    }

    setStatus(text, kind, retry) {
      this.status.textContent = '';
      this.status.className = 'isw-status' + (kind ? ' isw-' + kind : '');
      if (text) this.status.append(el('span', { text }));
      if (retry) this.status.append(el('button', { class: 'isw-retry', type: 'button', onclick: retry }, 'Try again'));
    }

    /* ---------- feature 4: back ---------- */

    // A spot becomes a "stop" after the participant stays on it for CONFIG.dwellMs, or when they
    // arrive there by a jump. Leaving a stop saves it for Back.
    armDwell() {
      clearTimeout(this.dwellTimer);
      this.dwellTimer = setTimeout(() => { this.stopY = this.scroller.scrollTop; }, CONFIG.dwellMs);
    }

    onScrollTick() {
      this.updateThumb();
      if (this.suppress) return;
      const y = this.scroller.scrollTop;
      if (this.stopY != null && Math.abs(y - this.stopY) > this.scroller.clientHeight * CONFIG.leaveFraction) {
        this.pushHistory(this.stopY);
        this.stopY = null;
      }
      this.armDwell();
    }

    jumpTo(part) {
      // clicking the outline, the rail, or a search result saves where you were
      this.pushHistory(this.scroller.scrollTop);
      this.stopY = null;
      this.hidePreview();
      this.scrollTo(this.offsetOf(part.el) - 24).then((y) => { this.stopY = y; this.armDwell(); });
      this.flash(part.el);
    }

    pushHistory(y) {
      const last = this.history[this.history.length - 1];
      if (last != null && Math.abs(last - y) < 24) return;
      this.history.push(y);
      if (this.history.length > 40) this.history.shift();
      this.updateBack(true);
    }

    goBack() {
      const y = this.history.pop();
      if (y == null) return;
      this.stopY = null;
      this.updateBack(false);
      this.scrollTo(y).then((to) => { this.stopY = to; this.armDwell(); });
    }

    updateBack(saved) {
      this.backBtn.disabled = this.history.length === 0;
      this.backBtn.title = this.history.length
        ? `Go back to the last spot you stopped on or jumped from (${this.history.length} saved)`
        : 'Go back to the last spot you stopped on or jumped from (none saved yet)';
      if (saved) {
        this.backBtn.classList.remove('isw-saved');
        void this.backBtn.offsetWidth;            // restart the animation
        this.backBtn.classList.add('isw-saved');
      }
    }

    // Hand-rolled ease: native smooth scrolling does not fire reliably inside the scroller.
    scrollTo(y) {
      return new Promise((resolve) => {
        this.suppress = true;
        clearTimeout(this.dwellTimer);
        const to = clamp(y, 0, Math.max(0, this.scroller.scrollHeight - this.scroller.clientHeight));
        const from = this.scroller.scrollTop, t0 = performance.now(), ms = 380;
        clearInterval(this.anim);
        this.anim = setInterval(() => {
          const t = Math.min(1, (performance.now() - t0) / ms);
          this.scroller.scrollTop = from + (to - from) * (1 - Math.pow(1 - t, 3));
          if (t >= 1) {
            clearInterval(this.anim);
            this.updateThumb();
            // let the last scroll event pass before listening again
            setTimeout(() => { this.suppress = false; resolve(this.scroller.scrollTop); }, 60);
          }
        }, 16);
      });
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
