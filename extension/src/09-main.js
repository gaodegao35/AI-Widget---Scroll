// Boot: pick an adapter, wait for content, build the scroller + chunks, start the modules,
// and provide the ⚙ menu that switches between the three prototypes (P1 / P2 / P3) or everything.
(() => {
  const SW = window.SW, U = SW.util;

  async function boot() {
    const adapter = SW.pickAdapter();
    SW.adapter = adapter;
    for (let i = 0; i < 40 && !adapter.ready(); i++) await new Promise(r => setTimeout(r, 500));
    if (!adapter.ready()) { SW.log('no content found for adapter', adapter.name); return; }
    const scroller = new SW.Scroller(adapter.scrollerEl());
    SW.scroller = scroller;
    SW.ai.check();

    SW.waypoints.init(scroller, adapter);
    SW.rail.init(scroller, adapter);
    SW.find.init(scroller, adapter);
    SW.ticker.init(scroller, adapter);
    SW.pins.init(scroller, adapter);
    SW.refs.init(scroller, adapter);

    const refresh = () => {
      if (!adapter.ready()) return;
      if (!scroller.isWindow && !scroller.el.isConnected) { scroller.rebind(adapter.scrollerEl()); SW.rail.place(); }
      const chunks = adapter.getChunks();
      SW.labeler.setChunks(chunks);
      SW.rail.render(chunks);
      SW.refs.process(chunks);
      // label what is near the viewport now; the rest is labeled lazily on scroll / hover
      SW.labeler.around(scroller.top + scroller.height / 2, scroller.height * 3);
      SW.log(`${adapter.name}: ${chunks.length} chunks`);
    };
    refresh();
    adapter.onChange(refresh);
    scroller.on(U.debounce(() => {
      SW.labeler.around(scroller.top + scroller.height / 2, scroller.height * 3);
      // warm the preview for where the reader has settled, so hovering nearby is instant
      SW.region.prefetch(SW.region.chunkAt(scroller.top + scroller.height / 2));
    }, 900));
    // layout can shift after images load / fonts swap
    window.addEventListener('load', () => SW.rail.render(SW.labeler.chunks));
    setTimeout(() => SW.rail.render(SW.labeler.chunks), 1500);
    // if the scroll container itself moves (sidebars, resizes), re-place overlays
    new ResizeObserver(() => { SW.rail.place(); SW.rail.render(SW.labeler.chunks); }).observe(scroller.isWindow ? document.documentElement : scroller.el);
    SW.bus.on('ai-status', () => {
      if (!SW.ai.hasKey) return;
      SW.labeler.around(scroller.top + scroller.height / 2, scroller.height * 3);
      SW.region.prefetch(SW.region.chunkAt(scroller.top + scroller.height / 2));
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
