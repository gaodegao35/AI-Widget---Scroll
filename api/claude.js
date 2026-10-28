// Server-side Claude proxy for the Intelligent Scrolling study.
//
// IRB constraints enforced here:
//   - The API key is read from ANTHROPIC_API_KEY and never leaves the server.
//   - Only three tasks exist, matching the three AI features in the protocol.
//   - The only data accepted is study content and the participant's search text. Any other field in
//     the request body is ignored, so a session code or timestamp cannot reach the model even by
//     accident.
//   - The model is Claude Opus 5, as named in the protocol and consent forms.

const MODEL = 'claude-opus-5';
const MAX_PROMPT = 120_000;

const PROMPTS = {
  // Feature 1: colored labeled markers, generated when a page loads.
  labels: (p) => `Below are the numbered parts of a ${p.kind === 'conversation' ? 'conversation between a person and an AI assistant' : 'document'}.

For each part, write a label a reader can use to decide whether to scroll there.

Rules:
- 2 to 5 words. No trailing punctuation.
- Name the specific subject of that part: "insurance for power tools", not "a discussion" or "more details".
- Every label must be distinguishable from the others. If two parts are similar, say what makes them different.
- Use the words of the content, not meta-description. Never begin with "the part where" or "discussion of".

- If the part contains a picture, a code block, or a table, say what that thing is about rather than
  naming it: "red bicycle logo", not "an image".

Return ONLY a JSON array, one entry per part, in order:
[{"id": "...", "label": "..."}]

Parts:
${JSON.stringify(p.sections)}`,

  // Feature 2: hover preview, generated when the participant hovers a marker.
  preview: (p) => `A reader is hovering over one part of a long ${p.kind === 'conversation' ? 'conversation' : 'document'} and is deciding whether to scroll to it.

Write a preview of that part. Be concrete: name the specific things it says. Do not describe it from the outside ("this section covers..."); say what it actually states.

Return ONLY JSON:
{"summary": "one or two sentences, under 45 words", "points": ["short phrase", "short phrase", "short phrase"]}

"points" holds 2 to 4 very short noun phrases naming the distinct things in this part, in the order they appear. No sentences.

The part${p.heading ? ` is headed "${p.heading}" and` : ''} reads:
${p.text}`,

  // Feature 3: search box, sent when the participant submits a search.
  search: (p) => `A reader of a long ${p.kind === 'conversation' ? 'conversation' : 'document'} is looking for: "${p.query}"

Rank the numbered parts below by how well each answers what the reader means. Paraphrases count; shared words are not required. Omit parts that do not match.

Return ONLY a JSON array, best first, at most 6 entries:
[{"id": "...", "why": "under 12 words, saying what is there"}]

If nothing matches, return [].

Parts:
${JSON.stringify(p.sections)}`
};

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, reason: 'method' });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(501).json({ ok: false, reason: 'no-key-on-server' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
  if (!body || typeof body !== 'object') return res.status(400).json({ ok: false, reason: 'bad-body' });

  const build = PROMPTS[body.task];
  if (!build) return res.status(400).json({ ok: false, reason: 'unknown-task' });

  // Whitelist the payload fields. Anything else the client sends is dropped before the model sees it.
  const src = body.payload || {};
  const payload = {
    kind: src.kind === 'conversation' ? 'conversation' : 'document',
    query: typeof src.query === 'string' ? src.query.slice(0, 500) : '',
    heading: typeof src.heading === 'string' ? src.heading.slice(0, 200) : '',
    text: typeof src.text === 'string' ? src.text.slice(0, 12000) : '',
    sections: Array.isArray(src.sections)
      ? src.sections.slice(0, 60).map(s => ({ id: String(s && s.id || '').slice(0, 24), text: String(s && s.text || '').slice(0, 1200) }))
      : []
  };

  let prompt;
  try { prompt = build(payload); } catch { return res.status(400).json({ ok: false, reason: 'bad-payload' }); }
  if (prompt.length > MAX_PROMPT) return res.status(413).json({ ok: false, reason: 'too-large' });

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        output_config: { effort: 'low' },
        system: 'You return only valid JSON. No prose, no markdown fences.',
        messages: [{ role: 'user', content: prompt }]
      })
    });
    if (!r.ok) {
      console.error('anthropic error', r.status, (await r.text()).slice(0, 400));
      return res.status(502).json({ ok: false, reason: 'upstream' });
    }
    const data = await r.json();
    const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    const cleaned = text.trim()
      .replace(/^```(?:json)?/i, '').replace(/```$/, '')
      .replace(/[“”]/g, '"').replace(/[‘’]/g, "'").trim();
    let result;
    try { result = JSON.parse(cleaned); } catch { return res.status(200).json({ ok: false, reason: 'bad-json' }); }
    // tolerate {"labels": [...]} / {"results": [...]} wrappers on the array tasks
    if (body.task !== 'preview' && result && !Array.isArray(result) && typeof result === 'object') {
      const arr = Object.values(result).find(v => Array.isArray(v));
      if (arr) result = arr;
    }
    return res.status(200).json({ ok: true, result });
  } catch (e) {
    console.error('proxy failure', e);
    return res.status(500).json({ ok: false, reason: 'proxy-failed' });
  }
};
