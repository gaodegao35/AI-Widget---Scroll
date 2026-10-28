/* Intelligent Scrolling widget — exactly the four features in the IRB protocol:
 *   1. colored labeled markers next to the scrollbar (labels generated when the page loads)
 *   2. hover preview of a part (generated when the participant hovers)
 *   3. search box taking keywords or a sentence (sent when the participant submits)
 *   4. back button (no AI) returning to the previous scroll position
 *
 * Constraints this file respects:
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
    hoverDelayMs: 350,   // only a deliberate hover asks for a preview
    maxResults: 6
  };

  const THEME_COLORS = {
    setup:    '#5b8def',
    problem:  '#e4572e',
    method:   '#17a398',
    finding:  '#8c5bd8',
    money:    '#d9a406',
    people:   '#2e9e5b',
    decision: '#d1467f',
    other:    '#7a7a86'
  };

  // ---------- small helpers ----------
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

  /* ============================ the widget ============================ */

  class ScrollWidget {
    /** @param {HTMLElement} scroller the scrolling content element
     *  @param {Array} parts [{id, el, heading, text}] in document order
     *  @param {'conversation'|'document'} kind */
    constructor(scroller, parts, kind) {
      this.scroller = scroller;
      this.parts = parts;
      this.kind = kind;
      this.history = [];          // scroll positions, in memory only
      this.previews = new Map();  // cleared with the page; see CONFIG.cachePreviews
      this.inflight = new Set();
      this.hits = new Set();
      this.build();
      this.loadLabels();
    }

    /* ---------- chrome ---------- */
    build() {
      this.root = el('div', { class: 'isw', role: 'complementary', 'aria-label': 'Page navigator' }, [
        el('div', { class: 'isw-top' }, [
          this.backBtn = el('button', {
            class: 'isw-back', type: 'button', disabled: true,
            title: 'Return to where you were before the last jump',
            onclick: () => this.goBack()
          }, [el('span', { class: 'isw-back-arrow', 'aria-hidden': 'true', text: '↩' }), 'Back']),
          el('form', {
            class: 'isw-searchform', onsubmit: (e) => { e.preventDefault(); this.runSearch(); }
          }, [
            this.input = el('input', {
              class: 'isw-input', type: 'search', placeholder: 'Search this page',
              'aria-label': 'Search this page. Type keywords or a sentence.',
              autocomplete: 'off', spellcheck: 'false'
            }),
            this.searchBtn = el('button', { class: 'isw-go', type: 'submit', title: 'Search' }, '→')
          ]),
          el('p', { class: 'isw-privacy', text: "Please don't type personal information." })
        ]),
        this.status = el('div', { class: 'isw-status', role: 'status', 'aria-live': 'polite' }),
        this.track = el('div', { class: 'isw-track' })
      ]);
      this.preview = el('div', { class: 'isw-preview', hidden: true, role: 'tooltip' });
      document.body.append(this.preview);
      this.scroller.parentElement.append(this.root);

      this.onScroll = () => this.onScrollTick();
      this.scroller.addEventListener('scroll', this.onScroll, { passive: true });
      // relayout when the content resizes and when the results list changes the track's height
      this.resizeObs = new ResizeObserver(() => this.layout());
      this.resizeObs.observe(this.scroller);
      this.resizeObs.observe(this.track);
      this.lastSettled = this.scroller.scrollTop;
      this.renderChips();
    }

    destroy() {
      this.scroller.removeEventListener('scroll', this.onScroll);
      this.resizeObs.disconnect();
      this.root.remove();
      this.preview.remove();
    }

    /* ---------- feature 1: colored labeled markers ---------- */
    async loadLabels() {
      this.setStatus('Reading the page…', 'busy');
      try {
        const sections = this.parts.map(p => ({ id: p.id, text: (p.heading ? p.heading + '. ' : '') + p.text.slice(0, 900) }));
        const out = await askClaude('labels', { kind: this.kind, sections });
        const byId = new Map((Array.isArray(out) ? out : []).map(r => [String(r.id), r]));
        this.parts.forEach(p => {
          const r = byId.get(p.id);
          if (r && r.label) { p.label = String(r.label).slice(0, 48); p.theme = THEME_COLORS[r.theme] ? r.theme : 'other'; }
        });
        this.setStatus('');
      } catch {
        // Degrade honestly rather than leaving an unusable rail: a document part falls back to its
        // own heading, which is already visible on the page, and a conversation part to its number.
        // Neither is AI-generated, and the retry button lets the participant ask again.
        this.parts.forEach((p, i) => { if (!p.label) { p.label = p.heading || `Part ${i + 1}`; p.theme = 'other'; p.fallback = true; } });
        this.setStatus("The AI didn't respond. You can keep scrolling or try again.", 'error', () => this.loadLabels());
      }
      this.renderChips();
    }

    renderChips() {
      this.track.textContent = '';
      this.chips = this.parts.map((p, i) => {
        const labelled = !!p.label;
        const chip = el('button', {
          class: 'isw-chip' + (labelled ? '' : ' isw-chip-wait') + (this.hits.has(p.id) ? ' isw-hit' : ''),
          type: 'button',
          'data-id': p.id,
          'aria-label': labelled ? `Go to: ${p.label}` : 'Loading label',
          onclick: () => this.jumpTo(p),
          onmouseenter: () => this.hoverChip(p, chip),
          onmouseleave: () => this.leaveChip(),
          onfocus: () => this.hoverChip(p, chip),
          onblur: () => this.leaveChip()
        }, [
          el('span', { class: 'isw-dot', style: `background:${THEME_COLORS[p.theme || 'other']}`, 'aria-hidden': 'true' }),
          el('span', { class: 'isw-label', text: labelled ? p.label : '·····' })
        ]);
        chip._part = p;
        return chip;
      });
      this.chips.forEach(c => this.track.append(c));
      this.layout();
    }

    // Position each chip at its share of the scroll height, then push overlapping ones down.
    layout() {
      if (!this.chips || !this.chips.length) return;
      const total = Math.max(1, this.scroller.scrollHeight);
      const h = this.track.clientHeight;
      const gap = 2;
      let prevBottom = -Infinity;
      this.chips.forEach(chip => {
        const p = chip._part;
        const y = this.offsetOf(p.el);
        const ideal = (y / total) * h;
        const ch = chip.offsetHeight || 24;
        const top = clamp(Math.max(ideal, prevBottom + gap), 0, Math.max(0, h - ch));
        chip.style.top = top + 'px';
        prevBottom = top + ch;
      });
      this.markViewport();
    }

    offsetOf(node) {
      return node.getBoundingClientRect().top - this.scroller.getBoundingClientRect().top + this.scroller.scrollTop;
    }

    markViewport() {
      if (!this.chips) return;
      const top = this.scroller.scrollTop, bottom = top + this.scroller.clientHeight;
      this.chips.forEach(chip => {
        const y = this.offsetOf(chip._part.el);
        chip.classList.toggle('isw-here', y >= top - 40 && y < bottom);
      });
    }

    /* ---------- feature 2: hover preview ---------- */
    hoverChip(part, chip) {
      clearTimeout(this.hoverTimer);
      this.hoverPart = part;
      const cached = CONFIG.cachePreviews ? this.previews.get(part.id) : null;
      if (cached) return this.showPreview(part, chip, cached);
      this.hoverTimer = setTimeout(() => this.fetchPreview(part, chip), CONFIG.hoverDelayMs);
    }

    leaveChip() {
      clearTimeout(this.hoverTimer);
      this.hideTimer = setTimeout(() => { this.preview.hidden = true; this.hoverPart = null; }, 160);
    }

    async fetchPreview(part, chip) {
      if (this.inflight.has(part.id)) return;
      this.inflight.add(part.id);
      this.showPreview(part, chip, { loading: true });
      try {
        const out = await askClaude('preview', {
          kind: this.kind, heading: part.heading || '', text: part.text.slice(0, 6000)
        });
        const data = { summary: String(out && out.summary || ''), points: Array.isArray(out && out.points) ? out.points.slice(0, 4) : [] };
        if (CONFIG.cachePreviews) this.previews.set(part.id, data);
        if (this.hoverPart === part) this.showPreview(part, chip, data);
      } catch {
        if (this.hoverPart === part) this.showPreview(part, chip, { error: true });
      } finally {
        this.inflight.delete(part.id);
      }
    }

    showPreview(part, chip, data) {
      clearTimeout(this.hideTimer);
      const body = data.loading
        ? [el('div', { class: 'isw-pv-loading', text: 'Looking at this part…' })]
        : data.error
          ? [el('div', { class: 'isw-pv-error', text: "The AI didn't respond. You can keep scrolling or try again." })]
          : [
            part.heading ? el('div', { class: 'isw-pv-head', text: part.heading }) : null,
            el('p', { class: 'isw-pv-text', text: data.summary }),
            data.points && data.points.length
              ? el('ul', { class: 'isw-pv-points' }, data.points.map(pt => el('li', { text: String(pt) })))
              : null
          ];
      this.preview.textContent = '';
      body.filter(Boolean).forEach(n => this.preview.append(n));
      this.preview.hidden = false;
      const r = chip.getBoundingClientRect();
      const rootR = this.root.getBoundingClientRect();
      this.preview.style.right = (window.innerWidth - rootR.left + 8) + 'px';
      this.preview.style.top = clamp(r.top + r.height / 2 - this.preview.offsetHeight / 2, 8, Math.max(8, window.innerHeight - this.preview.offsetHeight - 8)) + 'px';
    }

    /* ---------- feature 3: search ---------- */
    async runSearch() {
      const q = this.input.value.trim();
      if (!q) { this.clearHits(); this.setStatus(''); return; }
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
      this.chips.forEach(c => c.classList.toggle('isw-hit', this.hits.has(c._part.id)));
      this.status.textContent = '';
      this.status.className = 'isw-status';
      if (!results.length) { this.setStatus('No matching parts.'); return; }
      const list = el('ul', { class: 'isw-results' }, results.map((r, i) =>
        el('li', {}, [
          el('button', {
            class: 'isw-result', type: 'button', onclick: () => this.jumpTo(r.part)
          }, [
            el('span', { class: 'isw-dot', style: `background:${THEME_COLORS[r.part.theme || 'other']}`, 'aria-hidden': 'true' }),
            el('span', {}, [
              el('span', { class: 'isw-result-label', text: r.part.label || r.part.heading || `Part ${i + 1}` }),
              r.why ? el('span', { class: 'isw-result-why', text: r.why }) : null
            ])
          ])
        ])
      ));
      this.status.append(
        el('div', { class: 'isw-results-head' }, [
          `${results.length} result${results.length === 1 ? '' : 's'}`,
          el('button', { class: 'isw-clear', type: 'button', onclick: () => { this.input.value = ''; this.clearHits(); this.setStatus(''); } }, 'Clear')
        ]),
        list
      );
    }

    clearHits() {
      this.hits = new Set();
      if (this.chips) this.chips.forEach(c => c.classList.remove('isw-hit'));
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
      const y = this.offsetOf(part.el) - 24;
      this.scrollTo(y);
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

    updateBack() {
      this.backBtn.disabled = this.history.length === 0;
    }

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
          this.markViewport();
        }
      }, 16);
    }

    // A long manual scroll is also something to come back from.
    onScrollTick() {
      this.markViewport();
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
