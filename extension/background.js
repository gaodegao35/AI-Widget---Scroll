// Background service worker.
// 1) Toolbar click → inject the widget into any page not covered by manifest matches.
// 2) Optional Claude calls (labels / re-ranking / reference detection) when an API key is saved
//    on the options page. Every feature has a heuristic fallback, so the key is optional.

const FILES = [
  'src/00-ai-core.js', 'src/00-util.js', 'src/01-adapters.js', 'src/02-labeler.js', 'src/02b-region.js', 'src/03-waypoints.js',
  'src/04-rail.js', 'src/05-find.js', 'src/06-ticker.js', 'src/07-pins.js',
  'src/08-refs.js', 'src/09-main.js'
];

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;
  try {
    await chrome.scripting.insertCSS({ target: { tabId: tab.id }, files: ['src/widget.css'] });
    await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: FILES });
  } catch (e) {
    console.warn('[SW] inject failed', e);
  }
});

importScripts('src/00-ai-core.js');

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === 'sw-ai') {
    chrome.storage.local.get('claudeKey').then(r => SW_AI.callClaude(r.claudeKey, msg.task, msg.payload))
      .then(sendResponse)
      .catch(e => sendResponse({ ok: false, reason: 'error', detail: String(e) }));
    return true; // async
  }
  if (msg && msg.type === 'sw-haskey') {
    chrome.storage.local.get('claudeKey').then(r => sendResponse({ ok: !!r.claudeKey }));
    return true;
  }
});
