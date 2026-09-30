// The rail: an overlay next to the native scrollbar shared by all prototypes.
// Feature 4 (labeled markers) lives here; find (5) and ticker (6) draw on it too.
(() => {
  const SW = window.SW, U = SW.util;
  const MARKER_TYPES = new Set(['heading', 'prompt', 'answer', 'code', 'image', 'table']);
  // an answer whose content is a code block / image / table is represented by those artifacts instead
  const isMarker = (c) => MARKER_TYPES.has(c.type) && !(c.type === 'answer' && c.hasArtifacts);

  SW.rail = {
    el: null, track: null, thumb: null, lens: null, hits: new Set(), chunks: [],

    init(scroller, adapter) {
      this.scroller = scroller; this.adapter = adapter;
      const key = U.isMac ? '⌘⇧F' : 'Ctrl+Shift+F';
      this.el = U.el('div', { class: 'sw-ui sw-rail' }, [
        this.toolbar = U.el('div', { class: 'sw-rail-tools' }, [
          adapter.hasPrompts ? U.el('button', { class: 'sw-tool', title: 'Previous prompt', onclick: () => this.stepPrompt(-1), text: '▲' }) : null,
          adapter.hasPrompts ? U.el('button', { class: 'sw-tool', title: 'Next prompt', onclick: () => this.stepPrompt(1), text: '▼' }) : null,
          this.findBtn = U.el('button', { class: 'sw-tool', title: `Find (${key} or /)`, onclick: () => SW.find && SW.find.toggle(), text: '⌕' }),
          // lights up only when the AI half is unavailable, so a degraded demo is never silent
          this.aiDot = U.el('button', { class: 'sw-tool sw-aidot', hidden: '', title: 'AI unavailable — labels and find are running on heuristics', text: '◍' })
        ]),
        this.track = U.el('div', { class: 'sw-rail-track' }, [
          this.markers = U.el('div', { class: 'sw-rail-markers' }),
          this.thumb = U.el('div', { class: 'sw-rail-thumb' })
        ])
      ]);
      this.lens = U.el('div', { class: 'sw-ui sw-lens', hidden: '' });
      document.body.append(this.el, this.lens);

      this.track.addEventListener('mousemove', (e) => this.onHover(e));
      // grace period so the cursor can travel from the track into the lens
      this.track.addEventListener('mouseleave', () => this.hideLensSoon());
      this.lens.addEventListener('mouseenter', () => clearTimeout(this._hideT));
      this.lens.addEventListener('mouseleave', () => this.hideLensSoon());
      this.track.addEventListener('click', (e) => {
        if (e.target.closest('.sw-marker')) return;
        // click on empty track = jump to that position (like a scrollbar), with a waypoint
        const y = this.yFromEvent(e);
        SW.waypoints.jumpTo(y, { align: 0 });
      });

      const tick = U.throttle(() => this.updateThumb(), 30);
      scroller.on(tick);
      window.addEventListener('resize', () => { this.place(); this.render(this.chunks); });
      SW.bus.on('labels', () => this.refreshLabels());
      SW.bus.on('ai-status', () => this.applySettings());
      this.place();
      this.applySettings();
    },

    applySettings() {
      if (this.aiDot) this.aiDot.hidden = SW.ai.hasKey !== false;
    },

    place() {
      const r = this.scroller.rect();
      Object.assign(this.el.style, { top: r.top + 'px', left: (r.right - 22) + 'px', height: r.height + 'px' });
      SW.bus.emit('geometry');
      this.updateThumb();
    },

    trackRect() { return this.track.getBoundingClientRect(); },
    yToPct(y) { return U.clamp(y / Math.max(1, this.scroller.scrollHeight), 0, 1) * 100; },
    yFromEvent(e) { const tr = this.trackRect(); return U.clamp((e.clientY - tr.top) / tr.height, 0, 1) * this.scroller.scrollHeight; },

    updateThumb() {
      const s = this.scroller;
      const pct = s.top / Math.max(1, s.scrollHeight), h = s.height / Math.max(1, s.scrollHeight);
      this.thumb.style.top = (pct * this.track.clientHeight) + 'px';
      this.thumb.style.height = Math.max(6, h * this.track.clientHeight) + 'px';
    },

    // Called whenever chunks are (re)collected. Measures y once per render.
    render(chunks) {
      this.chunks = chunks;
      chunks.forEach(c => { c.y = this.scroller.offsetOf(c.el); });
      this.markers.innerHTML = '';
      const frag = document.createDocumentFragment();
      // coarse layer for long documents: too many ticks is noise, so drop sub-sections (they stay in the hover lens)
      let visible = chunks.filter(c => isMarker(c) || this.hits.has(c.id));
      const DENSE = 90;
      if (visible.length > DENSE) visible = visible.filter(c => this.hits.has(c.id) || !(c.type === 'heading' && (c.level || 2) >= 3));
      if (visible.length > DENSE) visible = visible.filter(c => this.hits.has(c.id) || !['image', 'table', 'code'].includes(c.type));
      this.el.classList.toggle('sw-dense', chunks.filter(isMarker).length > DENSE);
      let lastPct = -1, lane = 0;
      for (const c of visible) {
        const pct = this.yToPct(c.y);
        // stack markers that would overlap into lanes so they stay distinguishable
        lane = Math.abs(pct - lastPct) < 0.9 ? Math.min(lane + 1, 2) : 0;
        lastPct = pct;
        const m = U.el('div', { class: `sw-marker sw-t-${c.type}` + (this.hits.has(c.id) ? ' sw-hit' : '') + (c.type === 'heading' ? ` sw-h${c.level || 2}` : ''), 'data-id': c.id });
        m.style.top = pct + '%';
        m.style.right = (2 + lane * 5) + 'px';
        m.addEventListener('click', (e) => { e.stopPropagation(); SW.waypoints.jumpTo(c.el, { reason: 'marker' }); this.hideLens(); });
        m.addEventListener('mouseenter', () => this.showLens(c));
        frag.append(m);
      }
      this.markers.append(frag);
      this.updateThumb();
    },

    refreshLabels() { if (!this.lens.hidden && this._lensChunk) this.showLens(this._lensChunk); },

    setHits(ids) { this.hits = new Set(ids); this.render(this.chunks); },

    // Hovering the track shows the ~6 nearest markers with their labels, like a magnifier.
    onHover(e) {
      const y = this.yFromEvent(e);
      SW.labeler.around(y, this.scroller.height * 2);
      const cands = this.chunks.filter(c => isMarker(c) || this.hits.has(c.id));
      const near = cands.map(c => ({ c, d: Math.abs(c.y - y) })).sort((a, b) => a.d - b.d).slice(0, 6).map(x => x.c)
        .sort((a, b) => a.y - b.y);
      if (!near.length) return;
      this.renderLens(near, e.clientY, near.reduce((p, c) => Math.abs(c.y - y) < Math.abs(p.y - y) ? c : p));
    },
    showLens(c) {
      const idx = this.chunks.indexOf(c);
      const near = this.chunks.slice(Math.max(0, idx - 3), idx + 4).filter(x => isMarker(x) || this.hits.has(x.id));
      const m = this.markers.querySelector(`[data-id="${c.id}"]`);
      this.renderLens(near, m ? m.getBoundingClientRect().top : 0, c);
    },
    renderLens(list, clientY, focus) {
      this._lensChunk = focus;
      this.lens.innerHTML = '';
      list.forEach(c => {
        const row = U.el('div', { class: 'sw-lens-row' + (c === focus ? ' sw-focus' : '') + (this.hits.has(c.id) ? ' sw-hit' : ''), onclick: () => { SW.waypoints.jumpTo(c.el, { reason: 'lens' }); this.hideLens(); } }, [
          U.el('span', { class: 'sw-lens-ic', text: SW.TYPE_ICON[c.type] || '•' }),
          U.el('span', { class: 'sw-lens-label', text: SW.labeler.labelOf(c) }),
          c.turn ? U.el('span', { class: 'sw-lens-turn', text: `t${c.turn}` }) : null
        ]);
        this.lens.append(row);
      });
      // The AI half of the marker: what actually happens in the ~20 pages around this position.
      // The labels above are instant; this fills in underneath when it arrives.
      const region = SW.settings.regions !== false && focus ? SW.region.request(focus, () => { if (this._lensChunk === focus) this.renderLens(list, clientY, focus); }) : null;
      if (region) SW.region.prefetchAround(focus); // warm the neighbours while they read this one
      if (region && !region.failed) {
        const box = U.el('div', { class: 'sw-lens-region' });
        if (region.before) box.append(U.el('div', { class: 'sw-lens-flow', text: '↑ ' + region.before }));
        if (region.here) box.append(U.el('div', { class: 'sw-lens-here', text: region.here }));
        if (region.after) box.append(U.el('div', { class: 'sw-lens-flow', text: '↓ ' + region.after }));
        if (Array.isArray(region.beats) && region.beats.length) {
          box.append(U.el('div', { class: 'sw-lens-beats' }, region.beats.slice(0, 4).map(b => U.el('span', { class: 'sw-beat', text: b }))));
        }
        box.append(U.el('div', { class: 'sw-lens-src', text: '≈20 pages around here · Claude' }));
        this.lens.append(box);
      } else if (focus && SW.ai.hasKey && SW.settings.regions !== false && SW.region.isPending(focus)) {
        this.lens.append(U.el('div', { class: 'sw-lens-region sw-lens-wait', text: 'reading around this point…' }));
      } else if (focus && focus.type !== 'heading') {
        const excerpt = focus.type === 'image' ? (focus.alt || '') : (focus.text || '');
        if (excerpt) this.lens.append(U.el('div', { class: 'sw-lens-excerpt', text: excerpt.slice(0, 160) + (excerpt.length > 160 ? '…' : '') }));
        if (focus.labelSource) this.lens.append(U.el('div', { class: 'sw-lens-src', text: focus.el.dataset.label ? 'label: pre-computed' : `label: ${focus.labelSource}` }));
      }
      const r = this.el.getBoundingClientRect();
      this.lens.style.right = (window.innerWidth - r.left + 6) + 'px';
      this.lens.hidden = false;
      const h = this.lens.offsetHeight;
      this.lens.style.top = U.clamp((this._lensY ?? clientY) - h / 2, 8, Math.max(8, window.innerHeight - h - 8)) + 'px';
      this._lensY = clientY;
    },
    hideLensSoon() { clearTimeout(this._hideT); this._hideT = setTimeout(() => this.hideLens(), 250); },
    hideLens() { clearTimeout(this._hideT); this.lens.hidden = true; this._lensChunk = null; },

    stepPrompt(dir) {
      const prompts = this.chunks.filter(c => c.type === 'prompt');
      const cur = this.scroller.top + this.scroller.height * 0.18 + 2;
      const target = dir > 0 ? prompts.find(p => p.y > cur + 4) : [...prompts].reverse().find(p => p.y < cur - 4);
      if (target) SW.waypoints.jumpTo(target.el, { reason: 'prompt-step' });
    }
  };
})();
