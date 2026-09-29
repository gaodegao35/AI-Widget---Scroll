// Region preview — the AI part of the labeled marker.
// A label tells you the chapter. Hovering asks Claude to read the stretch of document around that
// position (roughly ±10 "pages" of content, clamped by token budget) and say what actually happens
// there: one line for the hovered spot, what leads up to it, what follows, and a few concrete beats.
// Cached per region, so hovering the same place twice is free.
(() => {
  const SW = window.SW, U = SW.util;
  const PAGE = 1800;          // characters ≈ one page of a book
  const SPAN = 10;            // pages either side
  const CHARS = PAGE * SPAN;  // per side
  const HOVER_DELAY = 260;    // don't fire while the cursor is sweeping past

  SW.region = {
    cache: new Map(), pending: new Map(), timer: null,

    // group chunks into regions so nearby hovers reuse one summary
    keyFor(chunk) {
      const chunks = SW.labeler.chunks;
      const heads = chunks.filter(c => c.type === 'heading' || c.type === 'prompt');
      if (!heads.length) return 'r' + Math.floor((chunk.y || 0) / (CHARS / 2));
      let owner = heads[0];
      for (const h of heads) { if (h.y <= (chunk.y ?? 0) + 1) owner = h; else break; }
      return 'h' + owner.id;
    },

    textAround(chunk) {
      const chunks = SW.labeler.chunks;
      const i = Math.max(0, chunks.indexOf(chunk));
      const take = (from, to, limit, fromEnd) => {
        const parts = [];
        let n = 0;
        const range = chunks.slice(from, to);
        for (const c of (fromEnd ? range.reverse() : range)) {
          if (c.type === 'answer' && c.hasArtifacts) continue;
          const t = c.type === 'heading' ? `\n## ${c.text}` : (c.text || c.alt || '');
          if (!t) continue;
          const slice = t.slice(0, 700);
          if (n + slice.length > limit) break;
          n += slice.length;
          parts[fromEnd ? 'unshift' : 'push'](slice);
        }
        return parts.join('\n');
      };
      return {
        before: take(0, i, CHARS, true),
        here: take(i, i + 4, PAGE * 2, false),
        after: take(i + 4, chunks.length, CHARS, false)
      };
    },

    // returns a cached summary synchronously, or null and fetches it
    get(chunk, onReady) {
      const key = this.keyFor(chunk);
      if (this.cache.has(key)) return this.cache.get(key);
      if (!SW.ai.hasKey || this.pending.has(key)) return null;
      const ctx = this.textAround(chunk);
      if ((ctx.here || '').length < 40) return null;
      const p = SW.ai.call('region', { kind: SW.adapter.hasPrompts ? 'conversation' : 'document', ...ctx })
        .then(res => {
          this.pending.delete(key);
          const ok = res && typeof res === 'object' && (res.here || (res.beats && res.beats.length));
          this.cache.set(key, ok ? res : { failed: true });
          if (onReady) onReady();
          return this.cache.get(key);
        })
        .catch(() => { this.pending.delete(key); });
      this.pending.set(key, p);
      return null;
    },

    // called on hover; waits a moment so sweeping the rail doesn't fire a request per pixel
    request(chunk, onReady) {
      clearTimeout(this.timer);
      const cached = this.get(chunk, null);
      if (cached) return cached;
      this.timer = setTimeout(() => this.get(chunk, onReady), HOVER_DELAY);
      return null;
    },

    isPending(chunk) { return this.pending.has(this.keyFor(chunk)); },

    // Prefetch keeps hovers instant: the region you are reading is warmed while you read, and the
    // neighbours of a hovered region are warmed while you look at it. Capped so we never fan out.
    MAX_INFLIGHT: 2,
    prefetch(chunk) {
      if (!chunk || !SW.ai.hasKey || SW.settings.regions === false) return;
      if (this.pending.size >= this.MAX_INFLIGHT) return;
      const key = this.keyFor(chunk);
      if (this.cache.has(key) || this.pending.has(key)) return;
      this.get(chunk, null);
    },
    // the chunk nearest a given content-y, used to warm "where the reader is now"
    chunkAt(y) {
      const chunks = SW.labeler.chunks.filter(c => c.y != null);
      let best = null;
      for (const c of chunks) { if (c.y <= y) best = c; else break; }
      return best || chunks[0];
    },
    prefetchAround(chunk) {
      if (!chunk) return;
      const heads = SW.labeler.chunks.filter(c => c.type === 'heading' || c.type === 'prompt');
      const i = heads.findIndex(h => this.keyFor(h) === this.keyFor(chunk));
      if (i < 0) return;
      [heads[i + 1], heads[i - 1]].forEach(h => h && this.prefetch(h));
    }
  };
})();
