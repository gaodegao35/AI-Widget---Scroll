// Feature 3 — point-to-find. Select a phrase (or type one) → semantic matches light up on the rail,
// ↑/↓ steps through them. Two-stage so it works on a book: a cheap local match over every chunk,
// then (if a key is saved) Claude re-ranks only the top candidates for paraphrases.
(() => {
  const SW = window.SW, U = SW.util;

  // A small paraphrase table so the fallback is not pure keyword search.
  const SYN = {
    parse: ['read', 'load', 'split', 'tokenize', 'process'], error: ['bug', 'exception', 'fail', 'crash', 'break', 'issue', 'problem'],
    image: ['picture', 'logo', 'visual', 'drawing', 'diagram', 'figure', 'illustration', 'render'], chart: ['graph', 'plot', 'bar', 'visualization'],
    table: ['grid', 'list', 'matrix', 'comparison'], fix: ['patch', 'repair', 'resolve', 'handle', 'solve', 'correct'],
    newline: ['linebreak', 'multiline', 'line'], speed: ['fast', 'performance', 'benchmark', 'timing', 'slow', 'latency'],
    code: ['snippet', 'function', 'script', 'implementation', 'program'], bicycle: ['bike', 'cycle'], bike: ['bicycle'],
    version: ['revision', 'iteration', 'variant', 'v1', 'v2', 'v3', 'v4', 'update'], test: ['unittest', 'check', 'assert', 'verify', 'pytest'],
    summary: ['recap', 'overview', 'summarize', 'tldr'], quote: ['quotation', 'quoted', 'escape', 'escaping'], scroll: ['scrollbar', 'scrolling', 'navigate'],
    history: ['origin', 'invented', 'first', 'early', 'past'], user: ['people', 'reader', 'person'], research: ['study', 'paper', 'experiment', 'finding'],
    unicode: ['bom', 'encoding', 'utf'], type: ['infer', 'inference', 'int', 'float', 'datatype'], readme: ['documentation', 'docs', 'instructions'],
    blue: ['colour', 'color'], red: ['colour', 'color'], state: ['machine', 'transition', 'fsm'], mouse: ['wheel', 'pointer', 'trackpad', 'touchpad']
  };
  const expand = (t) => new Set([t, ...(SYN[t] || []).map(U.stem)]);

  SW.find = {
    box: null, results: [], idx: -1, selpop: null,

    init(scroller) {
      this.scroller = scroller;
      const key = U.isMac ? '⌘⇧F' : 'Ctrl+Shift+F';
      this.box = U.el('div', { class: 'sw-ui sw-find', hidden: '' }, [
        U.el('div', { class: 'sw-find-row' }, [
          this.input = U.el('input', { class: 'sw-find-input', placeholder: 'Find by meaning… (or select text on the page)', spellcheck: 'false' }),
          this.count = U.el('span', { class: 'sw-find-count' }),
          U.el('button', { class: 'sw-tool', title: 'Previous (⇧Enter)', onclick: () => this.step(-1), text: '▲' }),
          U.el('button', { class: 'sw-tool', title: 'Next (Enter)', onclick: () => this.step(1), text: '▼' }),
          U.el('button', { class: 'sw-tool', title: 'Close (Esc)', onclick: () => this.close(), text: '✕' })
        ]),
        this.list = U.el('div', { class: 'sw-find-list' }),
        this.note = U.el('div', { class: 'sw-find-note' })
      ]);
      document.body.append(this.box);
      this.input.addEventListener('input', U.debounce(() => this.search(this.input.value), 180));
      this.input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); this.step(e.shiftKey ? -1 : 1); }
        if (e.key === 'Escape') { this.close(); }
        if (e.key === 'ArrowDown') { e.preventDefault(); this.step(1); }
        if (e.key === 'ArrowUp') { e.preventDefault(); this.step(-1); }
      });
      document.addEventListener('keydown', (e) => {
        if (!SW.settings.find) return;
        const mod = U.isMac ? e.metaKey : e.ctrlKey;
        if (mod && e.shiftKey && e.key.toLowerCase() === 'f') { e.preventDefault(); this.toggle(); }
        if (e.key === 'Escape' && !this.box.hidden) this.close();
      }, true);

      // Selection popover: "Find related" + "Pin"
      this.selpop = U.el('div', { class: 'sw-ui sw-selpop', hidden: '' });
      document.body.append(this.selpop);
      document.addEventListener('mouseup', (e) => { if (!U.isOurs(e.target)) setTimeout(() => this.onSelection(), 10); });
      document.addEventListener('mousedown', (e) => { if (!U.isOurs(e.target)) this.selpop.hidden = true; });
      SW.bus.on('geometry', () => this.place());
      this.place();
    },

    place() {
      const r = this.scroller.rect();
      this.box.style.top = (r.top + 12) + 'px';
      this.box.style.left = (r.left + Math.max(12, (r.width - 520) / 2)) + 'px';
    },

    onSelection() {
      const sel = window.getSelection();
      const text = sel && sel.toString().trim();
      if (!text || text.length < 2 || text.length > 1200 || !sel.rangeCount) { this.selpop.hidden = true; return; }
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      this.selpop.innerHTML = '';
      if (SW.settings.find && text.length <= 120) this.selpop.append(U.el('button', { class: 'sw-selbtn', text: '⌕ Find related', onclick: () => { this.open(text); this.selpop.hidden = true; } }));
      if (SW.settings.pins && SW.pins) this.selpop.append(U.el('button', { class: 'sw-selbtn', text: '📌 Pin', onclick: () => { SW.pins.pinSelection(text, sel.getRangeAt(0)); this.selpop.hidden = true; } }));
      if (!this.selpop.children.length) return;
      this.selpop.hidden = false;
      this.selpop.style.left = U.clamp(rect.left + rect.width / 2 - this.selpop.offsetWidth / 2, 8, window.innerWidth - this.selpop.offsetWidth - 8) + 'px';
      this.selpop.style.top = Math.max(8, rect.top - this.selpop.offsetHeight - 8) + 'px';
    },

    toggle() { this.box.hidden ? this.open() : this.close(); },
    open(q) {
      this.box.hidden = false; this.place();
      if (q != null) { this.input.value = q; this.search(q); }
      this.input.focus(); this.input.select();
    },
    close() { this.box.hidden = true; this.results = []; this.idx = -1; SW.rail.setHits([]); },

    score(chunk, qTokens, qRaw) {
      const ct = chunk._tok || (chunk._tok = new Set(U.tokens((chunk.text || '') + ' ' + (chunk.label || '') + ' ' + (chunk.alt || ''))));
      let s = 0;
      for (const t of qTokens) {
        const ex = expand(t);
        let best = 0;
        for (const e of ex) {
          if (ct.has(e)) { best = Math.max(best, e === t ? 1 : 0.7); break; }
          if (e.length >= 4) for (const w of ct) { if (w.startsWith(e) || e.startsWith(w) && w.length >= 4) { best = Math.max(best, 0.5); break; } }
        }
        s += best;
      }
      s /= Math.max(1, qTokens.length);
      if (qRaw.length > 3 && (chunk.text || '').toLowerCase().includes(qRaw.toLowerCase())) s += 0.5;
      if (chunk.type === 'heading') s *= 1.1;
      if (chunk.type === 'image' || chunk.type === 'code' || chunk.type === 'table') s *= 1.15; // artifacts are what people scroll back for
      return s;
    },

    async search(q) {
      q = (q || '').trim();
      this.list.innerHTML = ''; this.note.textContent = '';
      if (q.length < 2) { this.results = []; this.count.textContent = ''; SW.rail.setHits([]); return; }
      const qTokens = U.tokens(q);
      const scored = SW.labeler.chunks.map(c => ({ c, s: this.score(c, qTokens, q) })).filter(x => x.s >= 0.34).sort((a, b) => b.s - a.s).slice(0, 12);
      let results = scored.map(x => x.c);
      // an answer and the code/image/table inside it both matching → keep the artifact only
      results = results.filter(c => !(c.type === 'answer' && results.some(o => o !== c && c.el.contains(o.el))));
      this.results = results;
      this.idx = -1;
      this.renderResults(q, 'local');
      // second stage: paraphrase re-ranking with Claude, only over these few candidates
      if (await SW.ai.check()) {
        const ticket = (this._ticket = (this._ticket || 0) + 1);
        const ranked = await SW.ai.call('rerank', { query: q, candidates: this.results.map(c => ({ id: c.id, text: (c.text || c.alt || '').slice(0, 300) })) });
        if (ticket !== this._ticket || !Array.isArray(ranked)) return;
        const byId = Object.fromEntries(this.results.map(c => [c.id, c]));
        const re = ranked.map(id => byId[id]).filter(Boolean);
        if (re.length) { this.results = re; this.renderResults(q, 'ai'); }
      }
    },

    renderResults(q, source) {
      this.list.innerHTML = '';
      this.count.textContent = this.results.length ? `${this.results.length}` : '0';
      SW.rail.setHits(this.results.map(c => c.id));
      const terms = U.tokens(q);
      this.results.forEach((c, i) => {
        const raw = (c.text || c.alt || '');
        // excerpt around the first matching term
        let pos = -1;
        for (const t of terms) { const p = raw.toLowerCase().indexOf(t.slice(0, 4)); if (p >= 0 && (pos < 0 || p < pos)) pos = p; }
        const start = Math.max(0, pos - 50);
        let ex = U.esc(raw.slice(start, start + 150));
        terms.forEach(t => { if (t.length >= 3) ex = ex.replace(new RegExp(`(${t.slice(0, 5)}[a-z]*)`, 'ig'), '<mark>$1</mark>'); });
        const row = U.el('div', { class: 'sw-find-item' + (i === this.idx ? ' sw-cur' : ''), onclick: () => this.goTo(i) }, [
          U.el('span', { class: 'sw-lens-ic', text: SW.TYPE_ICON[c.type] || '•' }),
          U.el('div', {}, [
            U.el('div', { class: 'sw-find-label', text: SW.labeler.labelOf(c) + (c.turn ? `  · t${c.turn}` : '') }),
            U.el('div', { class: 'sw-find-ex', html: (start ? '…' : '') + ex })
          ])
        ]);
        this.list.append(row);
      });
      this.note.textContent = this.results.length ? (source === 'ai' ? 'ranked by meaning (Claude)' : 'ranked locally (keywords + paraphrase table)') : 'no matches';
    },

    step(d) {
      if (!this.results.length) return;
      this.idx = (this.idx + d + this.results.length) % this.results.length;
      this.goTo(this.idx);
    },
    goTo(i) {
      this.idx = i;
      const c = this.results[i];
      [...this.list.children].forEach((r, k) => r.classList.toggle('sw-cur', k === i));
      SW.waypoints.jumpTo(c.el, { reason: 'find' });
      this.count.textContent = `${i + 1}/${this.results.length}`;
    }
  };
})();
