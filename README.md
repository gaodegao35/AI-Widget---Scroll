# Scroll Widgets — AI Widgets (05-688) · Scrolling

Three janky prototypes for *scrolling that knows where you're going*, built as one Chrome extension with
shared plumbing. Each prototype answers one problem from the research phase:

| Prototype | Problem from the observations | Features |
|---|---|---|
| **P1 · Where is it?** | target location is uncertain → scanning, overshooting; scrollbar markers all look the same | 4 labeled markers · 3 point-to-find · 5 speed ticker · 7 waypoints |
| **P2 · Take me there & bring me back** | the AI says "see the version above" but you still have to find it; then you lose your place | 1 reference-to-jump · 7 waypoints |
| **P3 · Two places at once** | comparing two parts → people open a second tab | 10 pin & compare · 7 waypoints |

Feature 7 (waypoints + ⌘[ back) is shared: every AI-driven jump drops a waypoint, so you can always get back.

## Run it

**Option A — no install, for a quick look.** Serve the repo and open a fixture with `?dev`:

```sh
python3 -m http.server 8000        # from the repo root
open http://localhost:8000/fixtures/index.html
```
`chat.html?dev`, `article.html?dev`, `document.html?dev` load the widget straight from `extension/src/`.
To use Claude in this mode, open the ⚙ menu on the rail and paste an API key into the field at the bottom
(kept in that page's localStorage; the API accepts direct browser calls).

**Option B — the extension, for real pages and for testing.**
1. `chrome://extensions` → *Developer mode* → *Load unpacked* → pick `extension/`.
2. It activates automatically on `chatgpt.com` and on `localhost` (the fixtures, opened *without* `?dev`).
   On any other long page, click the toolbar icon to inject it.
3. Optional: extension *Options* → paste a Claude API key → live labels, paraphrase re-ranking, implicit references.

**What the key changes.** Without it, find is keyword matching plus a paraphrase table, labels are heuristic
(first words / first code line), and only explicit `[turn N]` / `[ref: "…"]` references become links. With it,
find ranks every passage by meaning in one call ("the gadget that spins between the mouse buttons" → the IntelliMouse
paragraph), labels near the viewport are rewritten by Claude ("Regenerate beats scrolling back"), and implicit
references ("the version above") are detected.

## Using it

- **Rail** (right edge): colored ticks = prompts / code / images / tables / headings. Hover the rail → a lens lists
  the nearest items with distinguishing labels; click to jump. ▲▼ at the top hop between *your* prompts.
- **⌘⇧F** (or the ⌕ button) → find by meaning. Or select text on the page → **⌕ Find related**.
  Hits light up orange on the rail; Enter / ↑↓ steps through them.
- **Flick fast** → a ticker names what is passing ("Setup → Results → Limitations").
- **⌘[ / ⌘]** (Alt+←/→) → back / forward through waypoints. A pill appears after each jump.
- **Hover a code block / image / table → 📌 Pin.** Or select text → **📌 Pin**. Pinned things stay in a pane at the
  bottom; pin a second for side-by-side. The pane suggests a counterpart ("⇄ compare with: parser v3").
- **Reference chips** in AI answers (`↑ turn 4 · parser v2`) jump to the original and highlight it.
- **⚙** on the rail switches between P1 / P2 / P3 / Everything so each prototype can be tested alone.

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
extension/
  manifest.json      MV3; content scripts on chatgpt.com + localhost, toolbar click injects elsewhere
  background.js      toolbar injection + optional Claude calls (labels / rerank / refs)
  options.html/js    API key
  src/
    00-util.js       namespace, settings & presets, Scroller (window or inner element), event bus, AI bridge
    01-adapters.js   chatgpt + generic article adapters → chunks {el, type, label, text, turn}
    02-labeler.js    lazy labels: pre-computed → Claude → heuristic
    03-waypoints.js  feature 7: jump detection, ⌘[ ⌘], pill, highlight
    04-rail.js       feature 4: rail, markers, lens, thumb, prompt arrows, density rule
    05-find.js       feature 3: local match + paraphrase table, optional Claude re-rank, selection popover
    06-ticker.js     feature 5: speed-dependent overlay
    07-pins.js       feature 10: pin pane, side-by-side, counterpart suggestion
    08-refs.js       feature 1: [turn N] / [ref: "…"] chips, implicit refs via Claude
    09-main.js       boot, refresh on DOM change, ⚙ menu
    widget.css
fixtures/            test pages (+ dev-loader.js for ?dev mode)
```

## Status

Janky prototype (Sept 16 deadline). Known gaps: no PDF reader yet (Chrome's viewer and Google Docs are closed to
content scripts — a pdf.js-based reader is the plan for the real prototype); the paraphrase table is small without
an API key; selectors on chatgpt.com may need a refresh when the site changes.
