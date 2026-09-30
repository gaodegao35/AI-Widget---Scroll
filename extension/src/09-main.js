// Boot: pick an adapter, wait for content, build the scroller + chunks, start the modules,
// and provide the ⚙ menu that switches between the three prototypes (P1 / P2 / P3) or everything.
(() => {
  const SW = window.SW, U = SW.util;

  SW.menu = {
    el: null,
    toggle(anchor) {
      if (this.el && !this.el.hidden) { this.el.hidden = true; return; }
      if (!this.el) { this.el = U.el('div', { class: 'sw-ui sw-menu' }); document.body.append(this.el); }
      this.render();
      const r = anchor.getBoundingClientRect();
      this.el.hidden = false;
      this.el.style.top = r.top + 'px';
      this.el.style.right = (window.innerWidth - r.left + 8) + 'px';
    },
    render() {
      const s = SW.settings, el = this.el; el.innerHTML = '';
      el.append(U.el('div', { class: 'sw-menu-title', text: 'Scroll Widgets · prototypes' }));
      const presets = [['P1', 'Where is it?  (markers + find + ticker + waypoints)'], ['P2', 'Take me there & back  (references + waypoints)'], ['P3', 'Two places at once  (pins + waypoints)'], ['ALL', 'Everything']];
      presets.forEach(([k, t]) => el.append(U.el('label', { class: 'sw-menu-row' }, [
        U.el('input', { type: 'radio', name: 'sw-preset', ...(s.preset === k ? { checked: '' } : {}), onchange: () => { SW.applyPreset(k); this.render(); } }), ' ', t])));
      el.append(U.el('div', { class: 'sw-menu-sub', text: 'features' }));
      [['markers', 'Labeled markers on the rail'], ['regions', 'Hover preview: what happens in ~20 pages (AI)'], ['find', 'Point-to-find (⌘⇧F / select text)'], ['ticker', 'Speed ticker when flicking'], ['waypoints', 'Waypoints + ⌘[ back'], ['pins', 'Pin & compare'], ['refs', 'Reference links in answers']]
        .forEach(([k, t]) => el.append(U.el('label', { class: 'sw-menu-row' }, [
          U.el('input', { type: 'checkbox', ...(s[k] ? { checked: '' } : {}), onchange: (e) => { SW.setSetting(k, e.target.checked); this.render(); } }), ' ', t])));
      const how = { extension: 'via the extension (key in extension storage)', proxy: 'via /api/claude (key on the server)', direct: 'direct from this page (key in localStorage)' }[SW.ai.mode];
      el.append(U.el('div', { class: 'sw-menu-sub', text: SW.ai.hasKey ? `AI: on — ${how}` : 'AI: off — heuristics + pre-computed labels' }));
      if (SW.ai.direct && SW.ai.mode !== 'proxy') {
        const inp = U.el('input', { class: 'sw-find-input', type: 'password', placeholder: 'Claude API key (sk-ant-…) — stays in this page’s localStorage', value: SW.ai.directKey() });
        const status = U.el('span', { class: 'sw-menu-sub', text: SW.ai.directKey() ? `saved (${SW.ai.directKey().length} chars) · ${location.host}` : 'not set' });
        const save = () => { SW.ai.setDirectKey(inp.value.trim()); status.textContent = inp.value.trim() ? `saved (${inp.value.trim().length} chars) · ${location.host}` : 'not set'; };
        inp.addEventListener('input', U.debounce(save, 300));
        inp.addEventListener('change', save);
        inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { save(); e.preventDefault(); } });
        el.append(U.el('div', { class: 'sw-menu-row' }, [inp, status]));
        el.append(U.el('button', { class: 'sw-mini', style: 'margin:2px 6px 6px', text: 'Test the key', onclick: async (e) => {
          e.target.textContent = 'testing…';
          const r = await self.SW_AI.callClaude(SW.ai.directKey(), 'rerank', { query: 'test', candidates: [{ id: 'a', text: 'a test' }] });
          e.target.textContent = r.ok ? '✓ key works' : `✗ ${r.reason}${r.detail ? ': ' + String(r.detail).slice(0, 120) : ''}`;
          SW.ai.hasKey = null; SW.ai.check();
        } }));
      }
      if (SW.ai.lastError) el.append(U.el('div', { class: 'sw-menu-sub', style: 'color:#ff8a8a', text: 'last AI error: ' + SW.ai.lastError }));
      el.append(U.el('div', { class: 'sw-menu-sub', text: `adapter: ${SW.adapter.name} · ${SW.labeler.chunks.length} chunks` }));
    }
  };

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
    SW.bus.on('settings', () => { SW.refs.process(SW.labeler.chunks); });
    SW.bus.on('ai-status', () => {
      if (!SW.ai.hasKey) return;
      SW.labeler.around(scroller.top + scroller.height / 2, scroller.height * 3);
      SW.region.prefetch(SW.region.chunkAt(scroller.top + scroller.height / 2));
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
