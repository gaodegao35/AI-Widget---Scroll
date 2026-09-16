// Background service worker.
// 1) Toolbar click → inject the widget into any page not covered by manifest matches.
// 2) Optional Claude calls (labels / re-ranking / reference detection) when an API key is saved
//    on the options page. Every feature has a heuristic fallback, so the key is optional.

const FILES = [
  'src/00-util.js', 'src/01-adapters.js', 'src/02-labeler.js', 'src/03-waypoints.js',
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

const PROMPTS = {
  // Distinguishing labels for scrollbar markers (Prototype 1, feature 4).
  label: (p) => `You label locations in a long document or chat so a reader can tell them apart on a scrollbar.
For each item, write a 2-4 word label that DISTINGUISHES it from the others (never generic like "code" or "image").
Return ONLY a JSON array: [{"id": "...", "label": "..."}].

Items:
${JSON.stringify(p.items)}`,

  // Paraphrase-tolerant re-ranking for point-to-find (Prototype 1, feature 3).
  rerank: (p) => `A reader is looking for: "${p.query}"
Rank the candidate passages by how well they match what the reader means (paraphrases count, exact words are not required).
Return ONLY a JSON array of candidate ids, best first. Omit candidates that do not match at all.

Candidates:
${JSON.stringify(p.candidates)}`,

  // Implicit references inside an AI answer (Prototype 2, feature 1).
  refs: (p) => `Below is an assistant message from a long chat, plus short excerpts of earlier messages.
Find phrases in the assistant message that refer back to a specific earlier message (e.g. "the version above", "the diagram I made", "as in my earlier reply").
Return ONLY a JSON array: [{"phrase": "<exact phrase copied from the message>", "targetId": "<id of the earlier message>"}]. Return [] if none.

Assistant message:
${p.message}

Earlier messages:
${JSON.stringify(p.earlier)}`
};

async function callClaude(task, payload) {
  const { claudeKey } = await chrome.storage.local.get('claudeKey');
  if (!claudeKey) return { ok: false, reason: 'no-key' };
  const build = PROMPTS[task];
  if (!build) return { ok: false, reason: 'unknown-task' };

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': claudeKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'claude-opus-5',
      max_tokens: 4096,
      output_config: { effort: 'low' },
      system: 'You return only valid JSON. No prose, no markdown fences.',
      messages: [{ role: 'user', content: build(payload) }]
    })
  });
  if (!res.ok) return { ok: false, reason: `http-${res.status}`, detail: await res.text() };
  const data = await res.json();
  const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
  try {
    const cleaned = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
    return { ok: true, result: JSON.parse(cleaned) };
  } catch {
    return { ok: false, reason: 'bad-json', detail: text };
  }
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === 'sw-ai') {
    callClaude(msg.task, msg.payload)
      .then(sendResponse)
      .catch(e => sendResponse({ ok: false, reason: 'error', detail: String(e) }));
    return true; // async
  }
  if (msg && msg.type === 'sw-haskey') {
    chrome.storage.local.get('claudeKey').then(r => sendResponse({ ok: !!r.claudeKey }));
    return true;
  }
});
