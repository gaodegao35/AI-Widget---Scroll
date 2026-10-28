# Intelligent Scrolling — study app

The website for the IRB-approved study *Including Artificial Intelligence in a UI Widget: Intelligent
Scrolling* (CMU STUDY2026-00000426). Built to `Intelligent_Scrolling_Study_App_Spec.md`.

Static pages plus one serverless function. No build step, no framework, no database.

---

## The two conditions

**Intelligent Scrolling (IS)** — exactly the four features the protocol allows, and no others:

| Feature | AI? | When it calls Claude |
|---|---|---|
| Colored labeled markers beside the scrollbar | yes | once, when a page loads (`labels`) |
| Hover preview of a part | yes | each time the participant hovers a marker (`preview`) |
| Search box, keywords or a sentence | yes | when the participant submits (`search`) |
| Back button to the previous scroll position | no | never |

Marker colour says what **kind** of content sits at that position. It is read from the content
itself, never generated, so it cannot be wrong; Claude writes only the label text beside it.

| Colour | Content | Badge |
|---|---|---|
| blue | prose | — |
| magenta | a picture or figure | `IMG` |
| green | a code or data block | `CODE` |
| amber | a table | `TABLE` |
| dark amber, ringed | a search hit (overrides the colour above) | — |

**Conventional Scrolling (CS)** — the same pages and styling with the rail removed, the ordinary
scrollbar, and zero calls to the API. No keyboard shortcut is bound anywhere in the app, so the
browser's own find (Ctrl/Cmd+F) is never intercepted in either condition.

## Running a session

Open the site. The researcher setup screen asks for the phase and session number, shows the computed
order, and starts the session. Or send a ready-made link: `?phase=2&s=7` (no personal information in
the URL). Everything after that is in one page — no pop-ups, no new tabs, no dialogs.

- **Phase 1** · checklist → introduction → first content page (4 tasks) → second content page
  (4 tasks) → 8 feedback questions → end. Odd session numbers start on the conversation, even on the
  document. Both pages use Set A with the AI tool on.
- **Phase 2** · checklist → introduction → [practice → conversation (4 timed tasks) → document
  (4 timed tasks) → SUS] → break → [the same for the other condition] → 5 interview questions → end.
  Order = ((session − 1) mod 4) + 1, per the table in the spec.

Timed tasks: the content is covered until **Start**; the timer counts up in mm:ss and is visible on
screen for the recording; **Found it / Done** pauses it and offers **Continue** (if the researcher
says it is not right) and **Next task**; at 2:00 it stops and shows "Time's up, let's move on."
Task 1 returns the page to the top; Tasks 2–4 do not, so Task 4 starts wherever Task 3 ended.
Times are shown and then discarded — nothing is kept.

## What is never stored or sent

No database, no `localStorage`, `sessionStorage`, `IndexedDB`, or cookies; no analytics, no session
replay, no error reporter. Everything lives in one in-memory object, so a refresh clears it, and the
end screen has a **Clear my answers** button as well.

The only request the browser makes is `POST /api/claude`, and the function whitelists the payload
before building a prompt: the fictional study content and the participant's typed search text, and
nothing else. A session code, a timestamp, or anything else a client sent would be dropped on the
server before the model saw it. `ANTHROPIC_API_KEY` is read from the environment and never reaches
the browser. The model is `claude-opus-5`, as named in the protocol and consent forms.

## Deploying

Vercel: import the repo, set **`ANTHROPIC_API_KEY`** in Project Settings → Environment Variables for
Production, deploy. Deployment Protection should be **off** for the production URL, or participants
hit a Vercel login wall. The pages are served with `X-Robots-Tag: noindex, nofollow`.

Locally, `vercel dev` gives the same thing including the function.

## Content

| File | Holds |
|---|---|
| `study/content-a.js` | Set A: a 30-message conversation and a 13-section document |
| `study/content-b.js` | Set B: matched in length and structure (30 messages, 13 sections) |
| `study/content-practice.js` | the short practice conversation, unrelated to A and B |
| `study/tasks.js` | the task sheet, all protocol wording, SUS, feedback and interview questions |

All of it is fictional and researcher-written. The simulated chatbot page carries no product name or
branding; the two speakers are labelled "You" and "Assistant".

## Decisions for the PI

1. **Task sheet.** `study/tasks.js` carries *draft* targets and questions, placed so Target 1 falls in
   the middle third of each page and Target 2 in the last third. Each entry has a `target1Locator` /
   `target2Locator` phrase for checking placement, and an `answer` field for Task 3 that is never
   rendered to the participant. Please confirm or replace all four rows before the first session.
2. **Preview caching.** `widget/widget.js` → `CONFIG.cachePreviews` is **false**, so a preview is
   generated on every hover, exactly as the protocol describes. Setting it to true reuses a preview
   within a page. It would not change what is sent to the AI, but it differs from the protocol
   wording, so it is off until you decide.
3. **Phase 1 content.** Phase 1 currently reuses Set A, which the spec permits. Say if you want
   separate Phase 1 pages.
4. **A fifth feature.** The reference buttons inside an assistant's closing summary — phrases that
   jump to the exchange they refer to — are arguably a feature beyond the four the protocol lists.
   Select-to-search is defensible as an input route into the existing search box, but the jump
   buttons are not. Either remove them before sessions or file a modification. They are confined to
   `renderWithRefs` / `wireRefs` in `study/app.js` and the authored `refs` arrays in the content.
5. **Failed-label fallback.** If the `labels` call fails, a marker falls back to its own section
   heading (documents) or "Part N" (conversations), and a **Try again** button appears. This is not
   AI output and adds no information that is not already on the page; it exists so one failed request
   does not make the rail useless for the rest of a task. Flagging it in case you would rather the
   markers stay blank.

## Acceptance checklist

- [x] No database, storage APIs, cookies for input, or analytics anywhere in the code
- [x] Refreshing any page clears all typed text and selections
- [x] Anthropic calls only from the server, only in the IS condition, carrying only content and search text
- [x] CS condition makes zero AI calls and leaves Ctrl/Cmd+F working
- [x] The setup screen gives the correct order for session numbers 1–8
- [x] Phase 2 timer is visible, stops at 2:00, and Task 4 does not reset scroll
- [x] All task, question, and SUS wording matches Sections 6–9 of the spec exactly
- [ ] Checked in current Chrome, Edge, Firefox, and Safari on a laptop *(verified in Chrome so far)*

## Layout

```
index.html              the whole app shell
study/app.js            flow: screens, task panel, timer, order computation
study/study.css         shell styling
study/content-*.js      fictional content
study/tasks.js          task sheet and protocol wording
widget/widget.js        the four features
widget/widget.css       widget styling
api/claude.js           server-side Claude proxy; the only place the key is read
vercel.json             clean URLs, noindex
```
