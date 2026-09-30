# Scroll Widgets — AI Widgets (05-688) · Scrolling

Three janky prototypes for *scrolling that knows where you're going*, built as one Chrome extension with
shared plumbing. Each prototype answers one problem from the research phase:

| Prototype | Problem from the observations | Features |
|---|---|---|
| **P1 · Where is it?** | target location is uncertain → scanning, overshooting; scrollbar markers all look the same | labeled markers · **region preview on hover** · point-to-find · speed ticker · waypoints |
| **P2 · Take me there & bring me back** | the AI says "see the version above" but you still have to find it; then you lose your place | 1 reference-to-jump · 7 waypoints |
| **P3 · Two places at once** | comparing two parts → people open a second tab | 10 pin & compare · 7 waypoints |

Feature 7 (waypoints + ⌘[ back) is shared: every AI-driven jump drops a waypoint, so you can always get back.

## Run it

**Deployed (the normal way).** The site is static pages plus one serverless function. On Vercel, set
**`ANTHROPIC_API_KEY`** in Project Settings → Environment Variables and deploy — no build step, no framework
preset. Routes:

| | |
|---|---|
| `/` | home — the findings, the two demos, what to press |
| `/gpt` | 36-turn ChatGPT conversation |
| `/document` | 24-chapter book (~400 paragraphs) |
| `/article` | shorter article, used for testing |
| `/api/claude` | the serverless proxy; the key never reaches the browser |

Anyone with the link spends your credits, so keep it unlisted or turn on Deployment Protection.

**Locally.** `vercel dev` gives you the same thing including `/api/claude`. A plain static server
(`python3 -m http.server`) also works, but without the function the AI half is unavailable: an amber dot
appears on the rail and labels and find fall back to heuristics.

**As a Chrome extension**, for real chatgpt.com: `chrome://extensions` → Developer mode → Load unpacked →
`extension/`. Put a key in the extension's Options page. Click the toolbar icon to inject it into any other
long page.

## Using it

- **Rail** (right edge): colored ticks = prompts / code / images / tables / headings. Hover the rail → a lens lists
  the nearest items with distinguishing labels; click to jump. ▲▼ at the top hop between *your* prompts.
- **⌘⇧F**, **/**, or the ⌕ button → find by meaning. Or select text on the page → **⌕ Find related**.
  Hits light up orange on the rail; Enter / ↑↓ steps through them.
- **Flick fast** → a ticker names what is passing ("Setup → Results → Limitations").
- **⌘[ / ⌘]** (Alt+←/→) → back / forward through waypoints. A pill appears after each jump.
- **Hover a code block / image / table → 📌 Pin.** Or select text → **📌 Pin**. Pinned things stay in a pane at the
  bottom; pin a second for side-by-side. The pane suggests a counterpart ("⇄ compare with: parser v3").
- **Reference chips** in AI answers (`↑ turn 4 · parser v2`) jump to the original and highlight it.
There is no settings panel and nothing to switch on: every page runs the whole widget.

## Real ChatGPT

The extension reads the real conversation DOM (`[data-message-author-role]`) and overlays its UI — nothing is
faked. For reference chips on the real site, add a ChatGPT custom instruction so the model emits anchors:

> When you refer to something from earlier in this conversation, add a citation right after it in the form
> `[ref: "short exact phrase from that earlier message"]`.

The widget also understands `[turn N]`. With an API key saved, implicit references ("the version above") are
detected by Claude and shown as dashed chips.

## Why the fixtures

Real ChatGPT is fine for demos but bad for testing: every participant gets a different conversation, labels would
have to be computed live, and a selector change can break a session. `fixtures/chat.html` is a scripted 36-turn
conversation (4 code versions, 4 images, 3 tables, answers that reference earlier turns) with the same DOM
contract as chatgpt.com and labels pre-computed in `data-label`. The extension can't tell the difference.

- `fixtures/chat.html` — all three prototypes
- `fixtures/article.html` — long article for P1 + P3
- `fixtures/document.html` — generated 24-chapter book: stress test for the lazy-labeling rule

## Region preview (the AI half of the marker)

A label tells you *which chapter* a position is — that's structure, and headings give it for free. Hovering asks
Claude to read the stretch of document around that position (≈10 pages either side, ~9k tokens) and answer the
question a label can't: *what actually happens here?* It returns what leads up to the position, what is at it, what
follows, and 2–4 concrete beats ("IntelliMouse wheel, 1996", "read wear (1992)"), so you can decide whether to scroll
there without going there.

Summaries are cached per region and prefetched: the region you have settled in is warmed while you read, and the
neighbours of a hovered region are warmed while you look at it (max 2 requests in flight). A cold hover takes ~6 s
and shows *"reading around this point…"*; a warm one is instant. Turn it off with **Hover preview** in the ⚙ menu.

## The "long document" rule

Nothing is processed for the whole document up front. Headings give the rail its coarse markers instantly; on dense
documents the rail shows only chapters + figures and keeps sections in the hover lens. Fine (AI) labels are requested
only for chunks near the viewport or under the rail hover, and cached. Find runs a cheap local match over everything,
then re-ranks only the top ~12 candidates with Claude. So a 400-paragraph book costs the same as a short chat until you
actually look at it.

## Test tasks (from the Tab 2 protocol)

| Prototype | Task | Measure |
|---|---|---|
| P1 | "Find the picture / passage you remember but don't know where it is" | time, reversals, overshoots, Cmd-F use |
| P2 | "Ask where X was discussed, go there, then return to where you were reading" | exact line vs. general area; second tab opened? |
| P3 | "Compare these two versions" | second tab opened? scroll round-trips |

## Layout

```
index.html           home page
gpt.html             ChatGPT conversation demo      → /gpt
document.html        24-chapter book demo           → /document
article.html         article demo                   → /article
widget-loader.js     loads the widget into a demo page
vercel.json          clean URLs
api/claude.js        serverless Claude proxy (ANTHROPIC_API_KEY), shares the prompts in 00-ai-core.js
extension/
  manifest.json      MV3; content script on chatgpt.com, toolbar click injects elsewhere
  background.js      injection + Claude calls for the extension build
  options.html/js    API key for the extension build
  src/
    00-ai-core.js    the four prompts + the Claude call (browser and Node)
    00-util.js       namespace, Scroller, event bus, AI bridge (extension or /api/claude)
    01-adapters.js   chatgpt + generic article adapters → chunks
    02-labeler.js    lazy labels: pre-computed → Claude → heuristic
    02b-region.js    region preview: ±10 pages → Claude → cached summary, with prefetch
    03-waypoints.js  jump detection, ⌘[ ⌘], pill, highlight
    04-rail.js       rail, markers, lens, thumb, prompt arrows, density rule
    05-find.js       local match + paraphrase table, Claude ranking, selection popover
    06-ticker.js     speed-dependent overlay
    07-pins.js       pin pane, side-by-side, counterpart suggestion
    08-refs.js       [turn N] / [ref: "…"] chips, implicit refs via Claude
    09-main.js       boot, refresh on DOM change
    widget.css
```

## Status

Janky prototype (Sept 16 deadline). Known gaps: no PDF reader yet (Chrome's viewer and Google Docs are closed to
content scripts — a pdf.js-based reader is the plan for the real prototype); the paraphrase table is small without
an API key; selectors on chatgpt.com may need a refresh when the site changes.
