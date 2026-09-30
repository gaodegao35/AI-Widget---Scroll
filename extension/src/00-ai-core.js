// Shared by background.js (importScripts) and, in ?dev mode, by the page itself.
// One function: callClaude(key, task, payload) → { ok, result | reason }.
(function (root) {
  const PROMPTS = {
    // Distinguishing labels for scrollbar markers (Prototype 1, feature 4).
    label: (p) => `You label locations in a long document or chat so a reader can tell them apart on a scrollbar.
For each item, write a 2-4 word label that DISTINGUISHES it from the others (never generic like "code" or "image").
Return ONLY a JSON array: [{"id": "...", "label": "..."}].

Items:
${JSON.stringify(p.items)}`,

    // Paraphrase-tolerant ranking for point-to-find (Prototype 1, feature 3).
    rerank: (p) => `A reader is looking for: "${p.query}"
Rank the candidate passages by how well they match what the reader MEANS. Paraphrases and synonyms count; exact words are not required.
Return ONLY a JSON array of candidate ids, best first, at most 12. Omit candidates that do not match at all.

Candidates:
${JSON.stringify(p.candidates)}`,

    // What happens in the region around a point (Prototype 1) — the hover "preview of 20 pages".
    region: (p) => `A reader is hovering over one position in a long ${p.kind}. Below is the content around that position, in order.
Write a preview of what is in this part, for someone deciding whether to scroll here.

Return ONLY JSON: {"here": "...", "before": "...", "after": "...", "beats": ["...", "..."]}
- "here": one sentence on what is happening AT the hovered position.
- "before": one short clause on what leads up to it (omit if there is nothing before).
- "after": one short clause on what follows (omit if there is nothing after).
- "beats": 2-4 very short noun phrases naming the distinct things in this stretch, in order. No full sentences.
Name specifics — people, places, terms, numbers. Never write "this section discusses".

BEFORE the position:
${p.before || '(nothing — start of document)'}

AT the position:
${p.here}

AFTER the position:
${p.after || '(nothing — end of document)'}`,

    // Implicit references inside an AI answer (Prototype 2, feature 1).
    refs: (p) => `Below is an assistant message from a long chat, plus short excerpts of earlier messages.
Find phrases in the assistant message that refer back to a specific earlier message the reader would have to SCROLL BACK to find (e.g. "the version above", "the diagram I made", "as in my earlier reply").
Ignore phrases that merely answer the immediately preceding request. Prefer precision: return [] rather than a doubtful match.
Return ONLY a JSON array: [{"phrase": "<exact phrase copied from the message>", "targetId": "<id of the earlier message>"}]. Return [] if none.

Assistant message:
${p.message}

Earlier messages:
${JSON.stringify(p.earlier)}`
  };

  async function callClaude(key, task, payload) {
    if (!key) return { ok: false, reason: 'no-key' };
    const build = PROMPTS[task];
    if (!build) return { ok: false, reason: 'unknown-task' };
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
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
      const cleaned = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').replace(/[\u201c\u201d]/g, '"').replace(/[\u2018\u2019]/g, "'").trim();
      let result = JSON.parse(cleaned);
      // array-returning tasks: tolerate {"ranking": [...]} / {"items": [...]} wrappers
      if (task !== 'region' && result && !Array.isArray(result) && typeof result === 'object') {
        const arr = Object.values(result).find(v => Array.isArray(v));
        if (arr) result = arr;
      }
      return { ok: true, result };
    } catch {
      return { ok: false, reason: 'bad-json', detail: text };
    }
  }

  root.SW_AI = { PROMPTS, callClaude };
  if (typeof module !== 'undefined' && module.exports) module.exports = { PROMPTS, callClaude };
})(typeof globalThis !== 'undefined' ? globalThis : self);
