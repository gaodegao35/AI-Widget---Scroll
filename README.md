# Intelligent Scrolling — study app

The website for the IRB-approved study *Including Artificial Intelligence in a UI Widget: Intelligent
Scrolling* (CMU STUDY2026-00000426). Built to `Intelligent_Scrolling_Study_App_Spec.md`.

Static pages plus one serverless function. No build step, no framework, no database.

---

## The tool

**Intelligent Scrolling** — exactly the four features the protocol allows, and no others:

| Feature | AI? | When it calls Claude | Where it is |
|---|---|---|---|
| Labeled markers | yes | once, when a page loads (`labels`) | an **outline** panel, opened and closed only by clicking the list icon at the top of the rail |
| Hover preview of a part | yes | each hover on a rail mark or outline item (`preview`) | dark card beside the pointer |
| Search box, words or a whole question | yes | when the participant submits (`search`) | right side of the page's title bar |
| Back ("Previous spot") | no | never | right side of the page's title bar |

The **rail** replaces the native scrollbar: a proportional map of the page with neutral marks and a
draggable thumb. There are no colors or content-type badges on the rail or in the outline; whether a
part holds a picture, code or a table is shown only in its preview (read from the page, never from
the AI). Search matches turn amber on the rail and in the outline.

The **preview** shows the label, one sentence (at most 20 words) on what the part says, what comes
just before it, and — when a search is active — whether the part matches that search. The search
text is the only participant input the preview sends.

**Previous spot** saves a position when the participant stays on it for 5 seconds and then moves
away, or jumps away from it with the outline, the rail or a search result. Arriving by a jump also
counts as a stop. Tunable in `CONFIG` at the top of `widget/widget.js` (`dwellMs`, `leaveFraction`).

No keyboard shortcut is bound anywhere in the app, so the browser's own find (Ctrl/Cmd+F) is never
intercepted.

## Running a session (moderated)

The researcher reads every task aloud from the session script (kept outside this repo, as a doc).
The website shows only context, the two long pages, and a button to move on — no setup screen, no
session number, no task panel, no on-screen timer, no questionnaires.

Flow: one-page introduction (the study, what they will do, the context of both pages) →
**conversation** → **article** → end screen. **Both pages always have the AI scrolling tool.**

```
/                 start of the session (send this link)
/?page=chat       jump straight to the conversation, for rehearsing
/?page=doc        jump straight to the article
```

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
| `study/content-chat.js` | Page 1: a 60-message (30-exchange) chat about redesigning a Tesla Model 3 dashboard for a course project, with 5 pictures, 4 code blocks and 8 tables |
| `study/content-doc.js` | Page 2: a 28-section fictional long-form article about a city cooling its neighborhoods, with 4 figures, 2 code/data blocks and 6 tables |
| `study/pages.js` | all participant-facing wording: welcome, page intros, end screen |

All of it is fictional and researcher-written. The simulated chat page carries no product name or
branding; the two speakers are labelled "You" and "Assistant". Messages support blank-line
paragraphs, `- ` and `1. ` lists, `**bold**` and `` `code` ``.

Each part sent to the AI starts with a one-line description of any picture, code block or table it
holds (its caption, language and first lines, or column names), so labels and search can name the
artifact rather than only the prose around it. This is still only study content.

## Decisions for the PI

1. **IRB fit.** The moderated format, AI on both pages (no in-session baseline), the new pages, the
   pre-test interview and the per-page ease rating differ from the approved protocol (Phase 1 /
   Phase 2, timed on-screen tasks, SUS). Check
   whether a modification is needed before the first participant. The four features and the data
   rules are unchanged.
2. **Preview caching.** `widget/widget.js` → `CONFIG.cachePreviews` is still **false**.
3. **Reference jump buttons** are removed (no `refs` in the new content, no code for them), which
   settles the earlier "fifth feature" question.
4. **Failed-label fallback** is unchanged: on failure a marker shows its section heading or "Part N"
   plus a **Try again** button.

## Acceptance checklist

- [x] No database, storage APIs, cookies for input, or analytics anywhere in the code
- [x] Refreshing any page clears all typed text and selections
- [x] Anthropic calls only from the server, only in the IS condition, carrying only content and search text
- [x] No keyboard shortcut is bound, so Ctrl/Cmd+F always works
- [x] The site opens on the welcome screen; both pages load the AI tool
- [ ] Labels, preview and search checked against the real API on the new, longer pages
- [ ] Checked in current Chrome, Edge, Firefox, and Safari on a laptop *(verified in Chrome so far)*

## Layout

```
index.html              the whole app shell
study/app.js            flow: setup, context screens, the two pages
study/study.css         shell styling
study/content-chat.js   page 1, the conversation
study/content-doc.js    page 2, the article
study/pages.js          participant-facing wording
widget/widget.js        the four features
widget/widget.css       widget styling
api/claude.js           server-side Claude proxy; the only place the key is read
vercel.json             clean URLs, noindex
```
