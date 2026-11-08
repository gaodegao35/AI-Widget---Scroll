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
  // Feature 1: labeled markers, generated when a page loads. Shown as a list beside the page, like a
  // table of contents, so each label must be easy to scan and say what a reader would find there.
  labels: (p) => `Below are the numbered parts of a ${p.kind === 'conversation' ? 'conversation between a person and an AI assistant' : 'long article'}.

A reader will see your labels as a list beside the page, like a table of contents, and will pick one to jump to the thing they are looking for.

For each part, write one label.

Rules:
- 3 to 7 words. Sentence case. No trailing punctuation. Plain, everyday words.
- Name the specific thing a reader would find there: "Color palette for the dark theme", not "Visual design discussion".
- If a part begins with [Picture: ...], [Code block ...] or [Table ...], name that thing in the label with a plain noun: "Bar chart of usability test times", "React code for the battery gauge", "Table of touch target sizes".
- ${p.kind === 'conversation' ? 'Describe the topic of the exchange, not who said what. Never start with "User", "Person", "Assistant", "Question about", or "Discussion of".' : 'Do not just copy the section heading; say what the section actually gives the reader.'}
- Every label must be clearly different from the others. If two parts are about similar things, say what makes each one different.

Return ONLY a JSON array, one entry per part, in order:
[{"id": "...", "label": "..."}]

Parts:
${JSON.stringify(p.sections)}`,

  // Feature 2: hover preview, generated when the participant hovers a marker. It must be quicker to
  // read than the part itself, and it says whether the part matches the reader's search, if any.
  preview: (p) => `A reader is hovering over one part of a long ${p.kind === 'conversation' ? 'conversation' : 'article'} to decide, in about two seconds, whether to go there.

Write "here": one sentence saying what this part tells the reader.
- At most 20 words, and always much shorter than the part itself.
- State the specific content: names, numbers, decisions, advice. Never describe it from outside ("This section discusses", "The assistant explains", "This part covers").
- If the part holds a picture, code, or a table, say what it shows.
${p.query
  ? `The reader searched this page for: "${p.query}"
Write "match": does this part contain what they searched for? Start with "Yes", "Partly", or "No", then a dash and at most 12 words saying what is or isn't there.`
  : 'Set "match" to null.'}

Return ONLY JSON: {"here": "...", "match": ${p.query ? '"..."' : 'null'}}

The part${p.heading ? ` is headed "${p.heading}" and` : ''} reads:
${p.text}`,

  // Feature 3: search box, sent when the participant submits a search.
  search: (p) => `A reader of a long ${p.kind === 'conversation' ? 'conversation' : 'article'} is looking for: "${p.query}"

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
