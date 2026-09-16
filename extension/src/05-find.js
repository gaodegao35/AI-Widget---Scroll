// Feature 3 — point-to-find. Select a phrase (or type one) → semantic matches light up on the rail,
// ↑/↓ steps through them. Two-stage so it works on a book: a cheap local match over every chunk,
// then (if a key is saved) Claude re-ranks only the top candidates for paraphrases.
(() => {
  const SW = window.SW, U = SW.util;

  // A small paraphrase table so the fallback is not pure keyword search.
  const SYN = {
    // domain
    parse: ['read', 'load', 'split', 'tokenize', 'process', 'scan', 'parser', 'parsing'], parser: ['parse', 'scanner', 'reader', 'code'],
    error: ['bug', 'exception', 'fail', 'failure', 'crash', 'break', 'broken', 'issue', 'problem', 'wrong'], bug: ['error', 'problem', 'issue', 'broken', 'break'],
    image: ['picture', 'photo', 'logo', 'visual', 'drawing', 'diagram', 'figure', 'illustration', 'render', 'graphic', 'icon', 'art'],
    picture: ['image', 'photo', 'logo', 'visual', 'drawing', 'illustration'], logo: ['image', 'icon', 'mark', 'brand', 'bicycle'],
    diagram: ['image', 'drawing', 'figure', 'chart', 'machine', 'state'], chart: ['graph', 'plot', 'bar', 'visualization', 'figure', 'diagram'], graph: ['chart', 'plot', 'bar'],
    table: ['grid', 'list', 'matrix', 'comparison', 'rows', 'columns', 'spreadsheet'], list: ['table', 'items'],
    fix: ['patch', 'repair', 'resolve', 'handle', 'solve', 'correct', 'fixed', 'update'], solve: ['fix', 'handle', 'resolve'],
    newline: ['linebreak', 'multiline', 'line', 'break', 'return'], line: ['newline', 'row'],
    speed: ['fast', 'slow', 'performance', 'benchmark', 'timing', 'latency', 'quick', 'time', 'seconds'], fast: ['speed', 'quick', 'performance', 'benchmark'],
    slow: ['speed', 'performance', 'benchmark'], performance: ['speed', 'benchmark', 'timing', 'fast', 'slow'], benchmark: ['speed', 'performance', 'timing', 'numbers'],
    code: ['snippet', 'function', 'script', 'implementation', 'program', 'source', 'python', 'def'], function: ['code', 'def', 'method'],
    bicycle: ['bike', 'cycle', 'logo'], bike: ['bicycle', 'cycle', 'logo'],
    version: ['revision', 'iteration', 'variant', 'v1', 'v2', 'v3', 'v4', 'update', 'edition'], latest: ['final', 'last', 'newest', 'v4'], final: ['latest', 'last', 'v4'], first: ['initial', 'earliest', 'v1'],
    test: ['unittest', 'check', 'assert', 'verify', 'pytest', 'testing', 'spec'], summary: ['recap', 'overview', 'summarize', 'tldr', 'everything', 'conclusion'], recap: ['summary', 'overview'],
    quote: ['quotation', 'quoted', 'escape', 'escaping'], escape: ['quote', 'quoted', 'backslash'],
    scroll: ['scrollbar', 'scrolling', 'navigate', 'navigation', 'wheel', 'flick'], scrollbar: ['scroll', 'thumb', 'bar', 'indicator'],
    history: ['origin', 'invented', 'first', 'early', 'past', 'before', 'beginning'], early: ['first', 'history', 'origin', 'before'],
    user: ['people', 'reader', 'person', 'participant'], people: ['user', 'reader', 'person'], research: ['study', 'paper', 'experiment', 'finding', 'literature', 'researchers'],
    unicode: ['bom', 'encoding', 'utf', 'byte'], bom: ['unicode', 'byte', 'mark', 'encoding'], encoding: ['unicode', 'utf', 'bom'],
    type: ['infer', 'inference', 'int', 'float', 'datatype', 'coerce', 'typed'], number: ['int', 'float', 'numeric', 'digit', 'coerce'], readme: ['documentation', 'docs', 'instructions', 'guide'],
    blue: ['colour', 'color'], red: ['colour', 'color'], color: ['red', 'blue', 'colour'], state: ['machine', 'transition', 'fsm', 'diagram'],
    mouse: ['wheel', 'pointer', 'trackpad', 'touchpad', 'intellimouse'], touch: ['phone', 'finger', 'flick', 'drag', 'iphone'], phone: ['touch', 'mobile', 'iphone', 'ios'],
    // general english
    make: ['create', 'build', 'write', 'generate', 'draw'], create: ['make', 'build', 'generate', 'write'], build: ['make', 'create', 'write'], write: ['make', 'create', 'draft'],
    draw: ['diagram', 'sketch', 'image', 'plot'], show: ['display', 'plot', 'draw'], explain: ['why', 'because', 'reason', 'deal', 'explanation'], why: ['explain', 'reason', 'because'],
    change: ['different', 'difference', 'diff', 'modify', 'update', 'changed'], difference: ['diff', 'change', 'compare', 'versus', 'vs'], compare: ['difference', 'versus', 'vs', 'comparison'],
    big: ['large', 'huge', 'long'], small: ['tiny', 'short', 'little'], long: ['big', 'large', 'lengthy'], start: ['begin', 'beginning', 'first', 'top', 'initial'], end: ['last', 'final', 'bottom', 'finish'],
    problem: ['issue', 'bug', 'error', 'trouble'], result: ['output', 'outcome', 'numbers', 'finding'], old: ['earlier', 'previous', 'legacy', 'before', 'prior'], previous: ['earlier', 'old', 'prior', 'before', 'above'],
    earlier: ['previous', 'old', 'before', 'above'], new: ['latest', 'recent', 'updated'], keep: ['stay', 'remain', 'preserve'], remove: ['drop', 'delete', 'strip'], drop: ['remove', 'delete', 'strip'],
    strip: ['remove', 'drop', 'delete'], add: ['include', 'append', 'insert'], handle: ['support', 'deal', 'process', 'manage'], support: ['handle', 'allow'],
    file: ['document', 'csv', 'text'], document: ['file', 'page', 'article'], example: ['instance', 'case', 'sample'], case: ['example', 'edge', 'scenario'],
    hard: ['difficult', 'tricky'], easy: ['simple', 'trivial'], wrong: ['incorrect', 'error', 'bug'], right: ['correct'],
    money: ['cost', 'price', 'dollar', 'pay'], cost: ['price', 'money', 'expensive'], time: ['duration', 'seconds', 'minutes', 'when'],
    place: ['location', 'position', 'where', 'spot'], location: ['place', 'position', 'where'], return: ['back', 'come', 'go'], find: ['search', 'locate', 'look']
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
      const all = SW.labeler.chunks.map(c => ({ c, s: this.score(c, qTokens, q) })).sort((a, b) => b.s - a.s);
      const scored = all.filter(x => x.s >= 0.34).slice(0, 12);
      let results = scored.map(x => x.c);
      // an answer and the code/image/table inside it both matching → keep the artifact only
      results = results.filter(c => !(c.type === 'answer' && results.some(o => o !== c && c.el.contains(o.el))));
      this.results = results;
      this.idx = -1;
      this.renderResults(q, 'local');
      // second stage: ask Claude to rank by meaning.
      //   small document (a chat, an article): one call over EVERYTHING.
      //   long document (a book): call 1 picks relevant sections from the headings, call 2 ranks the passages
      //   inside those sections (+ the local top hits), so a paraphrase with zero keyword overlap can still win.
      if (await SW.ai.check()) {
        const ticket = (this._ticket = (this._ticket || 0) + 1);
        this.note.textContent = 'searching by meaning…';
        const chunks = SW.labeler.chunks;
        let pool;
        if (chunks.length <= 150) pool = chunks;
        else {
          const heads = chunks.map((c, i) => ({ c, i })).filter(x => x.c.type === 'heading' || x.c.type === 'prompt');
          const context = (i) => { const n = chunks[i + 1]; return n && n.type !== 'heading' ? ' — ' + (n.text || '').slice(0, 140) : ''; };
          const sec = await SW.ai.call('rerank', { query: q, candidates: heads.map(x => ({ id: x.c.id, text: (x.c.text || '').slice(0, 80) + context(x.i) })) });
          if (ticket !== this._ticket) return;
          const chosen = new Set(Array.isArray(sec) ? sec.slice(0, 6) : []);
          const under = [];
          heads.forEach((x, k) => {
            if (!chosen.has(x.c.id)) return;
            const end = k + 1 < heads.length ? heads[k + 1].i : chunks.length;
            under.push(...chunks.slice(x.i, Math.min(end, x.i + 40)));
          });
          pool = [...new Set([...under, ...all.slice(0, 40).map(x => x.c)])];
        }
        const ranked = await SW.ai.call('rerank', { query: q, candidates: pool.map(c => ({ id: c.id, text: (c.text || c.alt || '').slice(0, 240) })) });
        if (ticket !== this._ticket) return;
        if (!Array.isArray(ranked)) { this.note.textContent += ' · AI unavailable, showing local ranking'; return; }
        const byId = Object.fromEntries(pool.map(c => [c.id, c]));
        let re = ranked.map(id => byId[id]).filter(Boolean).slice(0, 12);
        re = re.filter(c => !(c.type === 'answer' && re.some(o => o !== c && c.el.contains(o.el))));
        this.results = re; this.idx = -1; this.renderResults(q, 'ai');
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
        // one pass with a combined pattern, so an inserted <mark> tag can never be matched by a later term
        const stems = [...new Set(terms.filter(t => t.length >= 3).map(t => t.slice(0, 5).replace(/[^a-z0-9]/g, '')))].filter(Boolean);
        const rx = stems.length ? new RegExp(`\\b(${stems.join('|')})[a-z]*`, 'ig') : null;
        let html = '';
        if (rx) { let last = 0, m; const seg = raw.slice(start, start + 150); rx.lastIndex = 0;
          while ((m = rx.exec(seg))) { html += U.esc(seg.slice(last, m.index)) + '<mark>' + U.esc(m[0]) + '</mark>'; last = m.index + m[0].length; }
          html += U.esc(seg.slice(last)); }
        else html = U.esc(raw.slice(start, start + 150));
        const row = U.el('div', { class: 'sw-find-item' + (i === this.idx ? ' sw-cur' : ''), onclick: () => this.goTo(i) }, [
          U.el('span', { class: 'sw-lens-ic', text: SW.TYPE_ICON[c.type] || '•' }),
          U.el('div', {}, [
            U.el('div', { class: 'sw-find-label', text: SW.labeler.labelOf(c) + (c.turn ? `  · t${c.turn}` : '') }),
            U.el('div', { class: 'sw-find-ex', html: (start ? '…' : '') + html })
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
