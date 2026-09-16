// Feature 5 — speed-dependent semantic ticker. Nothing while reading; when the user flicks fast,
// an overlay names what is passing under the viewport (like a semantic version of the fast-scroll index).
(() => {
  const SW = window.SW, U = SW.util;
  const LANDMARK = new Set(['heading', 'prompt', 'answer']);

  SW.ticker = {
    init(scroller) {
      this.scroller = scroller;
      this.el = U.el('div', { class: 'sw-ui sw-ticker', hidden: '' }, [
        this.prev = U.el('div', { class: 'sw-ticker-side' }),
        this.main = U.el('div', { class: 'sw-ticker-main' }),
        this.next = U.el('div', { class: 'sw-ticker-side' })
      ]);
      document.body.append(this.el);
      let lastY = scroller.top, lastT = performance.now(), v = 0, hideT;
      scroller.on(() => {
        if (!SW.settings.ticker || SW.waypoints.suppress) return; // only for the user's own flicks, not our jumps
        const now = performance.now(), y = scroller.top;
        const dt = Math.max(1, now - lastT);
        v = 0.6 * v + 0.4 * (Math.abs(y - lastY) / dt); // px per ms, smoothed
        lastY = y; lastT = now;
        if (v > (SW.settings.tickerSpeed || 1.5)) {
          this.show();
          clearTimeout(hideT);
          hideT = setTimeout(() => { this.el.hidden = true; v = 0; }, 450);
        }
      });
      SW.bus.on('geometry', () => this.place());
      this.place();
    },
    place() {
      const r = this.scroller.rect();
      this.el.style.top = (r.top + r.height * 0.42) + 'px';
      this.el.style.left = (r.left + r.width / 2) + 'px';
    },
    show() {
      const marks = SW.labeler.chunks.filter(c => LANDMARK.has(c.type) && c.y != null);
      if (!marks.length) return;
      const mid = this.scroller.top + this.scroller.height * 0.4;
      let i = 0; while (i + 1 < marks.length && marks[i + 1].y <= mid) i++;
      const cur = marks[i], p = marks[i - 1], n = marks[i + 1];
      this.main.textContent = `${SW.TYPE_ICON[cur.type] || ''} ${SW.labeler.labelOf(cur)}`;
      this.prev.textContent = p ? `▲ ${SW.labeler.labelOf(p)}` : '';
      this.next.textContent = n ? `▼ ${SW.labeler.labelOf(n)}` : '';
      this.el.hidden = false;
    }
  };
})();
