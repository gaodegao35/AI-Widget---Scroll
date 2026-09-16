// Open any fixture with ?dev (e.g. chat.html?dev) to run the widget straight from ../extension/src
// without installing the extension. AI calls are unavailable in this mode (heuristics + pre-computed labels only).
(() => {
  if (!/[?&]dev\b/.test(location.search)) return;
  const base = '../extension/src/';
  const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = base + 'widget.css'; document.head.append(css);
  const files = ['00-util.js', '01-adapters.js', '02-labeler.js', '03-waypoints.js', '04-rail.js', '05-find.js', '06-ticker.js', '07-pins.js', '08-refs.js', '09-main.js'];
  const load = (i) => { if (i >= files.length) return; const s = document.createElement('script'); s.src = base + files[i]; s.onload = () => load(i + 1); document.body.append(s); };
  window.addEventListener('DOMContentLoaded', () => load(0));
})();
