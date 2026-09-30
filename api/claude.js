// Vercel serverless function: the deployed widget calls this instead of the Anthropic API directly,
// so the key never reaches the browser. Set ANTHROPIC_API_KEY in the project's environment variables.
//
// POST /api/claude  { task: "label" | "rerank" | "refs" | "region", payload: {...} }
//   → { ok: true, result } | { ok: false, reason }

const { PROMPTS } = require('../extension/src/00-ai-core.js');

const MODEL = 'claude-opus-5';
const MAX_BODY = 200_000; // a region call sends ~40k characters of document; refuse anything wild

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ ok: false, reason: 'method' });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(501).json({ ok: false, reason: 'no-key-on-server' });

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = null; } }
  if (!body || typeof body !== 'object') return res.status(400).json({ ok: false, reason: 'bad-body' });

  const { task, payload } = body;
  const build = PROMPTS[task];
  if (!build) return res.status(400).json({ ok: false, reason: 'unknown-task' });

  let prompt;
  try { prompt = build(payload || {}); } catch { return res.status(400).json({ ok: false, reason: 'bad-payload' }); }
  if (prompt.length > MAX_BODY) return res.status(413).json({ ok: false, reason: 'too-large' });

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
      const detail = await r.text();
      console.error('anthropic error', r.status, detail.slice(0, 500));
      return res.status(502).json({ ok: false, reason: `upstream-${r.status}` });
    }
    const data = await r.json();
    const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    const cleaned = text.trim()
      .replace(/^```(?:json)?/i, '').replace(/```$/, '')
      .replace(/[“”]/g, '"').replace(/[‘’]/g, "'").trim();
    let result;
    try { result = JSON.parse(cleaned); } catch { return res.status(200).json({ ok: false, reason: 'bad-json' }); }
    if (task !== 'region' && result && !Array.isArray(result) && typeof result === 'object') {
      const arr = Object.values(result).find(v => Array.isArray(v));
      if (arr) result = arr;
    }
    return res.status(200).json({ ok: true, result });
  } catch (e) {
    console.error('proxy failure', e);
    return res.status(500).json({ ok: false, reason: 'proxy-failed' });
  }
};
