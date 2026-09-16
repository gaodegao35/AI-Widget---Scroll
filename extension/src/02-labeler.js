// Lazy labeler. Labels are computed only for chunks near the viewport / near the rail hover,
// never for the whole document up front (a book would take forever). Order of preference:
//   pre-computed (data-label on the fixture pages)  →  Claude (if a key is saved)  →  heuristic.
(() => {
  const SW = window.SW, U = SW.util;

  function heuristic(c) {
    switch (c.type) {
      case 'code': {
        const first = (c.text || '').split(/\n| {2,}/).map(s => s.trim()).find(s => s && !/^#|^\/\//.test(s)) || 'code';
        return `${c.lang || 'code'} · ${first.slice(0, 34)}`;
      }
      case 'image': return c.alt ? U.firstWords(c.alt, 5) : 'image';
      case 'table': return c.heads && c.heads.length ? `table · ${c.heads.slice(0, 3).join(' | ').slice(0, 40)}` : 'table';
      case 'heading': return c.text;
      case 'prompt': return U.firstWords(c.text, 6);
      case 'answer': return c.headline || U.firstWords(c.text, 6);
      default: return U.firstWords(c.text, 6);
    }
  }
  SW.heuristicLabel = heuristic;

  const pending = new Set();
  let timer = null;

  SW.labeler = {
    chunks: [],
    setChunks(chunks) { this.chunks = chunks; },
    // Label now (sync) with whatever is cheapest; queue an AI upgrade if available.
    labelOf(c) {
      if (c.label) return c.label;
      c.label = heuristic(c);
      c.labelSource = 'heuristic';
      if (SW.ai.hasKey) this.queue(c);
      return c.label;
    },
    // Ask for labels for chunks around a content y (± 'span' px). Called on scroll idle and rail hover.
    around(y, span) {
      const near = this.chunks.filter(c => c.y != null && Math.abs(c.y - y) <= span && (!c.label || c.labelSource === 'heuristic'));
      near.forEach(c => { if (!c.label) this.labelOf(c); else this.queue(c); });
    },
    queue(c) {
      if (c.labelSource === 'ai' || c.labelSource === 'pending') return;
      pending.add(c);
      clearTimeout(timer);
      timer = setTimeout(() => this.flush(), 400);
    },
    async flush() {
      if (!pending.size || !(await SW.ai.check())) { pending.clear(); return; }
      const batch = [...pending].slice(0, 25);
      batch.forEach(c => { pending.delete(c); c.labelSource = 'pending'; });
      const items = batch.map(c => ({ id: c.id, type: c.type, lang: c.lang, text: (c.text || '').slice(0, 400) }));
      const res = await SW.ai.call('label', { items });
      if (Array.isArray(res)) {
        const byId = Object.fromEntries(batch.map(c => [c.id, c]));
        res.forEach(r => { const c = byId[r.id]; if (c && r.label) { c.label = String(r.label).slice(0, 48); c.labelSource = 'ai'; } });
        batch.forEach(c => { if (c.labelSource === 'pending') c.labelSource = 'heuristic'; });
        SW.bus.emit('labels');
      } else {
        batch.forEach(c => { c.labelSource = 'heuristic'; });
      }
      if (pending.size) this.flush();
    }
  };
})();
