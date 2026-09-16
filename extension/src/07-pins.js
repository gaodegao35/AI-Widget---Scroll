// Feature 10 — pin & compare. Pin a code block / image / table / message / selection and it stays in a
// pane while you scroll; pin a second one for side-by-side. The widget suggests a counterpart
// ("compare with the v2 version above?"). A pin is a waypoint made visible: "Go to" jumps back to it.
(() => {
  const SW = window.SW, U = SW.util;
  const PINNABLE = new Set(['code', 'image', 'table', 'answer', 'prompt', 'para', 'heading']);

  SW.pins = {
    pins: [], pane: null, hoverBtn: null, hoverChunk: null, spacer: null,

    init(scroller, adapter) {
      this.scroller = scroller; this.adapter = adapter;
      this.pane = U.el('div', { class: 'sw-ui sw-pinpane', hidden: '' }, [
        this.grip = U.el('div', { class: 'sw-pingrip', title: 'drag to resize' }),
        this.slots = U.el('div', { class: 'sw-pinslots' })
      ]);
      this.hoverBtn = U.el('button', { class: 'sw-ui sw-pinbtn', text: '📌 Pin', hidden: '', onclick: (e) => { e.stopPropagation(); if (this.hoverChunk) this.pin(this.hoverChunk); } });
      document.body.append(this.pane, this.hoverBtn);

      // hover affordance: the pin button follows the block under the cursor
      document.addEventListener('mousemove', U.throttle((e) => this.onMove(e), 60));
      // resize by dragging the grip
      let drag = null;
      this.grip.addEventListener('mousedown', (e) => { drag = { y: e.clientY, h: this.pane.offsetHeight }; e.preventDefault(); });
      window.addEventListener('mousemove', (e) => { if (drag) { this.height = U.clamp(drag.h + (drag.y - e.clientY), 120, this.scroller.height * 0.8); this.place(); } });
      window.addEventListener('mouseup', () => { drag = null; });
      this.height = Math.round(this.scroller.height * 0.38);
      SW.bus.on('geometry', () => this.place());
      SW.bus.on('settings', () => { if (!SW.settings.pins) this.hoverBtn.hidden = true; });
    },

    place() {
      const r = this.scroller.rect();
      Object.assign(this.pane.style, { left: (r.left + 8) + 'px', width: (r.width - 40) + 'px', top: (r.bottom - this.height) + 'px', height: this.height + 'px' });
    },

    onMove(e) {
      if (!SW.settings.pins || U.isOurs(e.target)) return;
      const chunks = SW.labeler.chunks;
      // innermost pinnable chunk under the cursor
      let best = null;
      for (const c of chunks) if (PINNABLE.has(c.type) && c.el.contains(e.target)) { if (!best || best.el.contains(c.el)) best = c; }
      if (best && best.type === 'answer') { // prefer the artifact inside an answer if the cursor is in one
        const inner = chunks.find(c => c !== best && c.el.contains(e.target) && ['code', 'image', 'table'].includes(c.type));
        if (inner) best = inner;
      }
      if (!best) { this.hoverBtn.hidden = true; this.hoverChunk = null; return; }
      if (best === this.hoverChunk && !this.hoverBtn.hidden) return;
      this.hoverChunk = best;
      const r = best.el.getBoundingClientRect();
      this.hoverBtn.hidden = false;
      this.hoverBtn.style.top = Math.max(4, r.top + 4) + 'px';
      this.hoverBtn.style.left = Math.max(4, r.right - this.hoverBtn.offsetWidth - 8) + 'px';
    },

    pin(chunk, opts = {}) {
      if (this.pins.find(p => p.chunk && p.chunk.el === chunk.el)) return;
      const body = chunk.el.cloneNode(true);
      body.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
      body.querySelectorAll('.sw-ui, .sw-ref').forEach(n => n.classList.remove('sw-ref'));
      this.add({ chunk, label: SW.labeler.labelOf(chunk), body, y: this.scroller.offsetOf(chunk.el) });
    },
    pinSelection(text, range) {
      const container = range.commonAncestorContainer.nodeType === 1 ? range.commonAncestorContainer : range.commonAncestorContainer.parentElement;
      const chunk = SW.labeler.chunks.filter(c => c.el.contains(container)).pop() || null;
      const body = U.el('blockquote', { class: 'sw-pinquote', text });
      this.add({ chunk, label: chunk ? SW.labeler.labelOf(chunk) : U.firstWords(text, 5), body, y: this.scroller.offsetOf(container), el: container });
    },

    add(pin) {
      if (this.pins.length >= 2) this.pins.shift(); // keep the two most recent
      this.pins.push(pin);
      this.render();
      this.hoverBtn.hidden = true;
    },
    remove(pin) { this.pins = this.pins.filter(p => p !== pin); this.render(); },

    // Counterpart suggestion: same kind of artifact that shares content with the pinned one.
    suggest(pin) {
      const c = pin.chunk; if (!c || this.pins.length >= 2) return null;
      const pinned = new Set(this.pins.map(p => p.chunk && p.chunk.el));
      const others = SW.labeler.chunks.filter(o => o.el !== c.el && o.type === c.type && !pinned.has(o.el));
      if (!others.length) return null;
      if (c.type === 'code') {
        const lines = new Set(c.lines || []);
        let best = null, bestN = 0;
        for (const o of others) {
          if (c.lang && o.lang && c.lang !== o.lang) continue;
          const n = (o.lines || []).filter(l => lines.has(l)).length;
          if (n > bestN) { bestN = n; best = o; }
        }
        return bestN >= 2 ? best : null;
      }
      if (c.type === 'image' || c.type === 'table') {
        // nearest earlier sibling of the same kind (v1 vs v2 of an image, two versions of a table)
        const before = others.filter(o => o.y < c.y);
        return before.length ? before[before.length - 1] : others[0];
      }
      return null;
    },

    render() {
      this.slots.innerHTML = '';
      this.pane.hidden = this.pins.length === 0;
      this.pane.classList.toggle('sw-two', this.pins.length === 2);
      this.setSpacer(this.pins.length ? this.height + 16 : 0);
      this.pins.forEach(pin => {
        const target = pin.chunk ? pin.chunk.el : pin.el;
        const sug = pin.chunk ? this.suggest(pin) : null;
        const slot = U.el('div', { class: 'sw-pinslot' }, [
          U.el('div', { class: 'sw-pinhead' }, [
            U.el('span', { class: 'sw-lens-ic', text: pin.chunk ? (SW.TYPE_ICON[pin.chunk.type] || '📌') : '📌' }),
            U.el('span', { class: 'sw-pinlabel', text: pin.label + (pin.chunk && pin.chunk.turn ? ` · t${pin.chunk.turn}` : '') }),
            sug ? U.el('button', { class: 'sw-mini sw-suggest', text: `⇄ compare with: ${SW.labeler.labelOf(sug)}`, onclick: () => this.pin(sug) }) : null,
            U.el('button', { class: 'sw-mini', text: 'Go to', onclick: () => target && SW.waypoints.jumpTo(target, { reason: 'pin' }) }),
            U.el('button', { class: 'sw-mini', text: '✕', onclick: () => this.remove(pin) })
          ]),
          U.el('div', { class: 'sw-pinbody' }, [pin.body])
        ]);
        this.slots.append(slot);
      });
      this.place();
    },

    // keep the end of the document reachable while the pane covers the bottom of the viewport
    setSpacer(h) {
      if (!this.spacer) { this.spacer = U.el('div', { class: 'sw-ui sw-spacer' }); this.scroller.contentEl().append(this.spacer); }
      this.spacer.style.height = h + 'px';
    }
  };
})();
