// Feature 1 — reference-to-jump. Phrases in an AI answer that point to earlier content become links:
//   explicit:  [turn 14]   or   [ref: "def parse_csv"]   (a ChatGPT custom instruction can make the model emit these)
//   implicit:  "the version above", "the diagram I made" — detected by Claude when a key is saved.
// Clicking scrolls to the original, highlights it, and drops a waypoint so ⌘[ brings you back.
(() => {
  const SW = window.SW, U = SW.util;
  const RX = /\[turn\s+(\d+)\]|\[ref:\s*"([^"]{3,120})"\]/gi;

  SW.refs = {
    init(scroller, adapter) { this.scroller = scroller; this.adapter = adapter; },

    process(chunks) {
      if (!SW.settings.refs || !this.adapter.hasPrompts) return;
      const messages = chunks.filter(c => c.type === 'prompt' || c.type === 'answer');
      messages.forEach((m, i) => {
        if (m.type !== 'answer' || m.el.dataset.swRefs) return;
        m.el.dataset.swRefs = '1';
        const earlier = messages.slice(0, i);
        const found = this.linkExplicit(m, earlier);
        // implicit refs only to messages further back than the prompt this answer is replying to
        if (!found && SW.ai.hasKey && i >= 3) this.linkImplicit(m, messages.slice(0, i - 1));
      });
    },

    findTarget(earlier, turn, phrase) {
      if (turn) return { msg: earlier.find(e => e.turn === turn), el: null };
      const p = phrase.toLowerCase();
      for (const e of earlier) {
        if (!(e.text || '').toLowerCase().includes(p)) continue;
        // narrow to the innermost element that still contains the phrase, for a precise highlight
        let el = e.el, inner;
        while ((inner = [...el.children].find(ch => U.text(ch).toLowerCase().includes(p)))) el = inner;
        return { msg: e, el };
      }
      return null;
    },

    chip(target, text) {
      const c = target.msg;
      const a = U.el('a', { class: 'sw-ref', href: '#', title: `Jump to turn ${c.turn}: ${SW.labeler.labelOf(c)}` }, [
        U.el('span', { class: 'sw-ref-arrow', text: '↑' }), text
      ]);
      a.addEventListener('click', (e) => { e.preventDefault(); SW.waypoints.jumpTo(target.el || c.el, { reason: 'ref' }); });
      return a;
    },

    linkExplicit(m, earlier) {
      let found = false;
      const walker = document.createTreeWalker(m.el, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.parentElement.closest('pre, code, .sw-ui') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
      const nodes = []; let n; while ((n = walker.nextNode())) if (RX.test(n.nodeValue)) nodes.push(n); RX.lastIndex = 0;
      nodes.forEach(node => {
        const frag = document.createDocumentFragment();
        let last = 0, mt; const s = node.nodeValue; RX.lastIndex = 0;
        while ((mt = RX.exec(s))) {
          frag.append(s.slice(last, mt.index));
          const target = this.findTarget(earlier, mt[1] ? +mt[1] : null, mt[2]);
          if (target && target.msg) { frag.append(this.chip(target, mt[1] ? `turn ${mt[1]} · ${SW.labeler.labelOf(target.msg)}` : `“${mt[2]}”`)); found = true; }
          else frag.append(mt[0]);
          last = mt.index + mt[0].length;
        }
        frag.append(s.slice(last));
        node.replaceWith(frag);
      });
      return found;
    },

    async linkImplicit(m, earlier) {
      const res = await SW.ai.call('refs', { message: (m.text || '').slice(0, 3000), earlier: earlier.map(e => ({ id: e.id, turn: e.turn, excerpt: (e.text || '').slice(0, 200) })) });
      if (!Array.isArray(res)) return;
      res.forEach(r => {
        const e = earlier.find(x => x.id === r.targetId); if (!e || !r.phrase) return;
        const walker = document.createTreeWalker(m.el, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.parentElement.closest('pre, code, .sw-ui, .sw-ref') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
        let n; while ((n = walker.nextNode())) {
          const i = n.nodeValue.indexOf(r.phrase); if (i < 0) continue;
          const after = n.splitText(i); after.splitText(r.phrase.length);
          const chip = this.chip({ msg: e, el: null }, r.phrase); chip.classList.add('sw-ref-implicit');
          after.replaceWith(chip); break;
        }
      });
    }
  };
})();
