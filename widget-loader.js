// Loads the scroll widget into a demo page. One mode: it always runs, on localhost and on the
// deployed site alike. The Claude calls go to /api/claude (the key lives on the server).
(() => {
  if (window.SW && window.SW.__loaded) return; // the Chrome extension already injected it
  const v = '?v=' + (window.SW_VERSION || Date.now()); // cache-bust during development
  const base = 'extension/src/';
  const css = document.createElement('link');
  css.rel = 'stylesheet'; css.href = base + 'widget.css' + v;
  document.head.append(css);
  const files = ['00-ai-core.js', '00-util.js', '01-adapters.js', '02-labeler.js', '02b-region.js',
    '03-waypoints.js', '04-rail.js', '05-find.js', '06-ticker.js', '07-pins.js', '08-refs.js', '09-main.js'];
  const load = (i) => {
    if (i >= files.length) return;
    const s = document.createElement('script');
    s.src = base + files[i] + v;
    s.onload = () => load(i + 1);
    document.body.append(s);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => load(0));
  else load(0);
})();
