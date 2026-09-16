// Feature 7 — scroll waypoints + undo. Shared plumbing for all three prototypes.
// Any big jump (a marker click, a find hit, a reference link, or a manual scroll > 2 screens)
// drops a waypoint. ⌘[ / Alt+← goes back, ⌘] / Alt+→ goes forward. A pill offers the same.
(() => {
  const SW = window.SW, U = SW.util;
  const JUMP_SCREENS = 2;

  SW.waypoints = {
    stack: [], forward: [], settled: null, suppress: false, pill: null, pillTimer: null,

    init(scroller) {
      this.scroller = scroller;
      this.settled = scroller.top;
      let settleTimer;
      scroller.on(() => {
        if (this.suppress) return;
        clearTimeout(settleTimer);
        settleTimer = setTimeout(() => {
          const y = scroller.top;
          if (this.settled != null && Math.abs(y - this.settled) > JUMP_SCREENS * scroller.height) this.push(this.settled, 'scroll');
          this.settled = y;
        }, 350);
      });
      document.addEventListener('keydown', (e) => {
        if (!SW.settings.waypoints) return;
        const mod = U.isMac ? e.metaKey : e.ctrlKey;
        if ((mod && e.key === '[') || (e.altKey && e.key === 'ArrowLeft')) { e.preventDefault(); this.back(); }
        if ((mod && e.key === ']') || (e.altKey && e.key === 'ArrowRight')) { e.preventDefault(); this.fwd(); }
      }, true);
      this.pill = U.el('div', { class: 'sw-ui sw-pill', hidden: '' });
      document.body.append(this.pill);
      SW.bus.on('geometry', () => this.place());
    },

    place() {
      if (!this.pill || this.pill.hidden) return;
      const r = this.scroller.rect();
      this.pill.style.left = (r.left + 16) + 'px';
      this.pill.style.top = (r.top + 14) + 'px';
    },

    labelAt(y) {
      const chunks = (SW.labeler.chunks || []).filter(c => c.y != null && ['heading', 'prompt', 'answer', 'code', 'image', 'table'].includes(c.type));
      const probe = y + this.scroller.height * 0.25;
      let best = null;
      for (const c of chunks) { if (c.y <= probe) best = c; else break; }
      if (best) return `${SW.TYPE_ICON[best.type] || ''} ${SW.labeler.labelOf(best)}`;
      return `${Math.round(100 * y / Math.max(1, this.scroller.scrollHeight))}% down`;
    },

    push(y, reason, label) {
      const wp = { y, reason, label: label || this.labelAt(y), t: Date.now() };
      const last = this.stack[this.stack.length - 1];
      if (last && Math.abs(last.y - y) < 40) return;
      this.stack.push(wp);
      if (this.stack.length > 50) this.stack.shift();
      this.forward = [];
      this.showPill();
      SW.bus.emit('waypoints');
    },

    // Programmatic jump used by every feature. Records where you came from.
    jumpTo(target, opts = {}) {
      if (!SW.settings.waypoints && !opts.force) { /* still scroll, just don't record */ }
      const y = typeof target === 'number' ? target : this.scroller.offsetOf(target) - this.scroller.height * (opts.align ?? 0.18);
      if (SW.settings.waypoints) this.push(this.scroller.top, opts.reason || 'jump', opts.fromLabel);
      this.go(y);
      if (target && target.nodeType) this.highlight(target);
    },

    async go(y) {
      this.suppress = true;
      await this.scroller.scrollTo(y, true);
      clearTimeout(this._unsup);
      this._unsup = setTimeout(() => { this.suppress = false; this.settled = this.scroller.top; }, 400);
    },

    back() {
      const wp = this.stack.pop();
      if (!wp) return;
      this.forward.push({ y: this.scroller.top, label: this.labelAt(this.scroller.top), reason: 'back' });
      this.go(wp.y);
      this.showPill();
      SW.bus.emit('waypoints');
    },
    fwd() {
      const wp = this.forward.pop();
      if (!wp) return;
      this.stack.push({ y: this.scroller.top, label: this.labelAt(this.scroller.top), reason: 'fwd' });
      this.go(wp.y);
      this.showPill();
      SW.bus.emit('waypoints');
    },

    showPill() {
      if (!SW.settings.waypoints) return;
      const last = this.stack[this.stack.length - 1];
      const next = this.forward[this.forward.length - 1];
      if (!last && !next) { this.pill.hidden = true; return; }
      const key = U.isMac ? '⌘' : 'Ctrl+';
      this.pill.innerHTML = '';
      if (last) this.pill.append(U.el('button', { class: 'sw-pill-btn', onclick: () => this.back(), title: `${key}[` },
        [U.el('span', { class: 'sw-pill-arrow', text: '↩' }), U.el('span', { text: 'Back to: ' }), U.el('b', { text: last.label }), U.el('kbd', { text: `${key}[` })]));
      if (next) this.pill.append(U.el('button', { class: 'sw-pill-btn', onclick: () => this.fwd(), title: `${key}]` },
        [U.el('span', { class: 'sw-pill-arrow', text: '↪' }), U.el('span', { text: 'Forward to: ' }), U.el('b', { text: next.label }), U.el('kbd', { text: `${key}]` })]));
      this.pill.hidden = false;
      this.place();
      clearTimeout(this.pillTimer);
      this.pillTimer = setTimeout(() => { this.pill.hidden = true; }, 12000);
    },

    highlight(el) {
      document.querySelectorAll('.sw-flash').forEach(e => e.classList.remove('sw-flash'));
      el.classList.add('sw-flash');
      setTimeout(() => el.classList.remove('sw-flash'), 2600);
    }
  };
})();
