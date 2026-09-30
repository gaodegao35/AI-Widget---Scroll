// Runs the widget straight from ../extension/src — with ?dev locally, automatically when deployed
// without installing the extension. In this mode the ⚙ menu has a field for a Claude API key (kept in this page's localStorage).
(() => {
  // Load the widget when asked with ?dev, and always on a deployed host (Vercel), where the
  // extension's content script does not run. Skip if the extension already injected it.
  const LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  const wanted = /[?&]dev\b/.test(location.search) || (!LOCAL && location.protocol !== 'file:');
  if (!wanted || (window.SW && window.SW.__loaded)) return;
  const base = '../extension/src/';
  const v = '?v=' + Date.now(); // cache-bust so a reload always picks up edited source
  const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = base + 'widget.css' + v; document.head.append(css);
  const files = ['00-ai-core.js', '00-util.js', '01-adapters.js', '02-labeler.js', '02b-region.js', '03-waypoints.js', '04-rail.js', '05-find.js', '06-ticker.js', '07-pins.js', '08-refs.js', '09-main.js'];
  const load = (i) => { if (i >= files.length) return; const s = document.createElement('script'); s.src = base + files[i] + v; s.onload = () => load(i + 1); document.body.append(s); };
  window.addEventListener('DOMContentLoaded', () => load(0));
})();
