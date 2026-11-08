/* Study runner for "Including Artificial Intelligence in a UI Widget: Intelligent Scrolling"
 * (CMU STUDY2026-00000426) — moderated version.
 *
 * The researcher reads every task aloud from the session script. The website only shows context,
 * the two long pages, and a button to move on. Flow:
 *
 *   [researcher setup] → welcome / context → page 1 intro → conversation → page 2 intro → article → end
 *
 * Each page is shown either with the AI scrolling tool ("ai") or with a regular scrollbar
 * ("regular"), chosen per page on the setup screen or in the link: ?s=3, or ?chat=ai&doc=regular.
 *
 * IRB constraints respected here:
 *   - Nothing is stored. No localStorage/sessionStorage/IndexedDB/cookies, no database.
 *   - No analytics or interaction logging of any kind.
 *   - No name, email, or personal field anywhere. The session number only picks the default
 *     condition and is never sent anywhere.
 *   - The only network call is the widget's POST /api/claude, on "ai" pages only, carrying study
 *     content and the participant's typed search text.
 *   - All state lives in the STATE object below, so a refresh clears everything.
 *   - No window.alert/confirm/prompt, no pop-ups, no new tabs, no keyboard shortcuts.
 */
(() => {
  'use strict';

  const P = window.STUDY_PAGES;
  const CONTENT = window.STUDY_CONTENT;

  // ---- in-memory state only ----
  const STATE = { session: null, cond: null, screens: [], at: 0, widget: null };

  const app = document.getElementById('app');
  const el = (tag, attrs = {}, kids = []) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else if (v !== null && v !== undefined && v !== false) n.setAttribute(k, v === true ? '' : v);
    }
    for (const c of [].concat(kids)) if (c != null && c !== false) n.append(c.nodeType ? c : document.createTextNode(String(c)));
    return n;
  };

  /* ===================== conditions ===================== */

  // Default counterbalancing: odd sessions get the AI tool on the conversation, even sessions on
  // the article. The page order itself is fixed: conversation first, article second.
  function defaultCond(session) {
    return session % 2 === 1 ? { chat: 'ai', doc: 'regular' } : { chat: 'regular', doc: 'ai' };
  }
  const condName = (c) => (c === 'ai' ? 'AI scrolling tool' : 'Regular scrollbar');
  const linkFor = (session, cond) => {
    const q = new URLSearchParams({ s: String(session), chat: cond.chat, doc: cond.doc });
    return location.origin + location.pathname + '?' + q.toString();
  };

  /* ===================== screen plumbing ===================== */

  function show(i) {
    if (STATE.widget) { STATE.widget.destroy(); STATE.widget = null; }
    STATE.at = Math.max(0, Math.min(i, STATE.screens.length - 1));
    app.textContent = '';
    const node = STATE.screens[STATE.at]();
    app.append(node);
    const heading = node.querySelector('.card h1');
    if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); }
    else { const sc = node.querySelector('.page-scroll'); if (sc) sc.focus({ preventScroll: true }); }
  }
  const next = () => show(STATE.at + 1);

  const panel = (kids, wide) => el('div', { class: 'screen' }, [el('div', { class: 'card' + (wide ? ' card-wide' : '') }, kids)]);
  const primary = (label, onclick) => el('button', { class: 'btn btn-primary', type: 'button', onclick }, label);

  /* ===================== researcher setup ===================== */

  function setupScreen() {
    let session = 1;
    let cond = defaultCond(1);
    let touched = false; // once the researcher picks a condition by hand, the session number stops overriding it

    const summary = el('div', { class: 'order-summary' });
    const radios = {};

    const render = () => {
      for (const page of ['chat', 'doc']) for (const c of ['ai', 'regular']) radios[page + c].checked = cond[page] === c;
      const link = linkFor(session, cond);
      summary.textContent = '';
      summary.append(
        el('div', { class: 'order-line' }, [el('b', { text: 'Session ' + session }), touched ? ' · conditions set by hand' : ` · default for an ${session % 2 ? 'odd' : 'even'} session`]),
        el('ol', { class: 'order-list' }, [
          el('li', { text: `Page 1, conversation — ${condName(cond.chat)}` }),
          el('li', { text: `Page 2, article — ${condName(cond.doc)}` })
        ]),
        el('div', { class: 'order-link' }, [
          el('span', { class: 'field-label', text: 'Link to send the participant' }),
          el('code', { class: 'linkbox', text: link })
        ])
      );
    };

    const sessionInput = el('input', {
      class: 'field', type: 'number', min: '1', step: '1', value: '1', id: 'session-number',
      oninput: (e) => {
        session = Math.max(1, parseInt(e.target.value, 10) || 1);
        if (!touched) cond = defaultCond(session);
        render();
      }
    });

    const pageChoice = (page, label) => el('div', {}, [
      el('span', { class: 'field-label', text: label }),
      el('div', { class: 'radio-row' }, ['ai', 'regular'].map(c => el('label', { class: 'radio' }, [
        radios[page + c] = el('input', {
          type: 'radio', name: 'cond-' + page, value: c,
          onchange: () => { cond = Object.assign({}, cond, { [page]: c }); touched = true; render(); }
        }),
        el('span', { text: condName(c) })
      ])))
    ]);

    const node = panel([
      el('p', { class: 'eyebrow', text: 'Researcher setup' }),
      el('h1', { text: 'Intelligent Scrolling study' }),
      el('p', { class: 'lede', text: 'Pick the session number and the scrollbar for each page, then send the link below or start here. Nothing on this screen is stored.' }),
      el('div', { class: 'field-row' }, [
        el('div', {}, [el('label', { class: 'field-label', for: 'session-number', text: 'Session number' }), sessionInput])
      ]),
      el('div', { class: 'field-row' }, [
        pageChoice('chat', 'Page 1 · conversation'),
        pageChoice('doc', 'Page 2 · article')
      ]),
      summary,
      el('div', { class: 'actions' }, [primary('Start session', () => startSession(session, cond))]),
      el('p', { class: 'fineprint', text: 'The link holds only the session number and the two conditions — no personal information.' })
    ]);
    render();
    return node;
  }

  /* ===================== participant screens ===================== */

  const welcomeScreen = () => panel([
    el('h1', { text: P.welcome.title }),
    el('p', { class: 'lede', text: P.welcome.lede }),
    el('div', { class: 'context-list' }, P.welcome.pages.map(pg => el('div', { class: 'context-item' }, [
      el('h2', { text: pg.label }),
      el('p', { text: pg.text })
    ]))),
    el('p', { class: 'fineprint', text: P.welcome.note }),
    el('div', { class: 'actions' }, [primary('Continue', next)])
  ], true);

  const introScreen = (page) => () => {
    const w = P[page];
    return panel([
      el('p', { class: 'eyebrow', text: w.eyebrow }),
      el('h1', { text: w.title }),
      el('p', { class: 'body', text: w.text }),
      el('p', { class: 'tool-line tool-' + STATE.cond[page], text: P.tool[STATE.cond[page]] }),
      el('p', { class: 'fineprint', text: 'Wait for your researcher to tell you when to open it.' }),
      el('div', { class: 'actions' }, [primary(w.open, next)])
    ]);
  };

  const endScreen = () => panel([
    el('h1', { text: P.end.title }),
    el('p', { class: 'body', text: P.end.text }),
    el('p', { class: 'fineprint', text: P.end.note })
  ]);

  /* ===================== rich text ===================== */

  // Inline: **bold** and `code`. Built from text nodes only — never innerHTML.
  function inline(text) {
    const out = [];
    text.split(/(\*\*[^*]+\*\*|`[^`]+`)/).forEach(seg => {
      if (!seg) return;
      if (seg.startsWith('**') && seg.endsWith('**')) out.push(el('strong', { text: seg.slice(2, -2) }));
      else if (seg.startsWith('`') && seg.endsWith('`')) out.push(el('code', { class: 'inline-code', text: seg.slice(1, -1) }));
      else out.push(seg);
    });
    return out;
  }

  // Blocks: blank line = new block; "- " lines = bullet list; "1. " lines = numbered list.
  function rich(text) {
    const nodes = [];
    text.split('\n\n').forEach(block => {
      let list = null, listType = null;
      block.split('\n').forEach(line => {
        const bullet = line.match(/^- (.*)$/);
        const num = line.match(/^\d+\. (.*)$/);
        const type = bullet ? 'ul' : num ? 'ol' : null;
        if (type) {
          if (!list || listType !== type) { list = el(type); listType = type; nodes.push(list); }
          list.append(el('li', {}, inline((bullet || num)[1])));
        } else if (line.trim()) {
          list = null; listType = null;
          nodes.push(el('p', {}, inline(line)));
        }
      });
    });
    return nodes;
  }
  const plain = (t) => String(t || '').replace(/\*\*/g, '').replace(/`/g, '');

  /* ===================== content pages ===================== */

  // What the AI is told about a picture, code block, or table in a part. It comes first, so it is
  // never cut off when long parts are truncated, and so labels can name the artifact.
  function describeBlocks(m) {
    const out = [];
    if (m.image) out.push(`[Picture: ${m.image.caption || m.image.alt}]`);
    if (m.code) out.push(`[Code block (${m.code.lang}): ${m.code.body.split('\n').slice(0, 6).join(' / ')}]`);
    if (m.table) out.push(`[Table with columns: ${m.table.headers.filter(Boolean).join(', ')}. First row: ${m.table.rows[0].join(', ')}]`);
    return out.join('\n');
  }

  // An assistant message or a section may carry a picture, a code block, or a table.
  function attachBlocks(host, m) {
    if (m.image) {
      const fig = el('figure', { class: 'msg-figure' });
      const holder = el('div', { class: 'msg-figure-art', role: 'img', 'aria-label': m.image.alt });
      holder.innerHTML = m.image.svg;          // researcher-authored markup, not user input
      fig.append(holder, el('figcaption', { text: m.image.caption || m.image.alt }));
      host.append(fig);
    }
    if (m.code) {
      host.append(el('pre', { class: 'msg-code' }, [
        el('span', { class: 'msg-code-lang', text: m.code.lang }),
        el('code', { text: m.code.body })
      ]));
    }
    if (m.table) {
      host.append(el('div', { class: 'table-wrap' }, [el('table', { class: 'msg-table' }, [
        el('thead', {}, [el('tr', {}, m.table.headers.map(h => el('th', { text: h })))]),
        el('tbody', {}, m.table.rows.map(r => el('tr', {}, r.map(c => el('td', { text: c })))))
      ])]));
    }
  }

  // Build the readable page and the list of parts the widget navigates.
  function renderContent(data, kind) {
    const parts = [];
    const scroller = el('div', { class: 'page-scroll', tabindex: '0' });
    const inner = el('article', { class: 'page-inner page-' + kind });

    if (kind === 'conversation') {
      const msgs = data.messages;
      for (let i = 0; i < msgs.length; i += 2) {
        const pair = msgs.slice(i, i + 2);
        const block = el('div', { class: 'exchange' }, pair.map(m => {
          const bubble = el('div', { class: 'bubble' }, rich(m.text));
          attachBlocks(bubble, m);
          if (m.after) rich(m.after).forEach(n => bubble.append(n));
          return el('div', { class: 'msg msg-' + m.role }, [
            el('div', { class: 'avatar', 'aria-hidden': 'true', text: m.role === 'user' ? 'Y' : 'A' }),
            el('div', { class: 'msg-body' }, [el('span', { class: 'who', text: m.role === 'user' ? 'You' : 'Assistant' }), bubble])
          ]);
        }));
        inner.append(block);
        const blocks = pair.map(describeBlocks).filter(Boolean).join('\n');
        const words = pair.map(m => `${m.role === 'user' ? 'Person' : 'Assistant'}: ${plain(m.text)}${m.after ? '\n' + plain(m.after) : ''}`).join('\n');
        parts.push({ id: 'p' + (parts.length + 1), el: block, heading: '', text: (blocks ? blocks + '\n' : '') + words });
      }
    } else {
      inner.append(
        el('h1', { class: 'page-title', text: data.title }),
        data.subtitle ? el('p', { class: 'page-sub', text: data.subtitle }) : null
      );
      data.sections.forEach((sec) => {
        const block = el('section', { class: 'docsec' }, [
          el('h2', { text: sec.heading }),
          ...sec.paras.map(t => el('p', { text: t }))
        ]);
        attachBlocks(block, sec);
        inner.append(block);
        const blocks = describeBlocks(sec);
        parts.push({ id: 'p' + (parts.length + 1), el: block, heading: sec.heading, text: (blocks ? blocks + '\n' : '') + sec.paras.join('\n\n') });
      });
    }

    scroller.append(inner);
    const wrap = el('div', { class: 'scrollwrap' }, [scroller]);

    let stage;
    if (kind === 'conversation') {
      stage = el('div', { class: 'chatapp' }, [
        el('aside', { class: 'chat-side', 'aria-hidden': 'true' }, [
          el('div', { class: 'chat-newchat', text: '+ New chat' }),
          el('div', { class: 'chat-side-head', text: 'Recent' }),
          el('div', { class: 'chat-conv chat-conv-on', text: data.title }),
          ...(data.sidebar || []).map(t => el('div', { class: 'chat-conv', text: t }))
        ]),
        el('div', { class: 'chat-main' }, [
          el('div', { class: 'chat-head' }, [el('span', { class: 'chat-title', text: data.title })]),
          wrap,
          // decorative: inert and unfocusable, so a participant cannot type into it.
          el('div', { class: 'chat-composer', 'aria-hidden': 'true' }, [el('span', { text: 'Message the assistant…' })])
        ])
      ]);
    } else {
      stage = el('div', { class: 'docapp' }, [
        el('div', { class: 'doc-head', 'aria-hidden': 'true' }, [el('span', { class: 'doc-site', text: 'The Long Read' }), el('span', { class: 'doc-section', text: 'Cities · Climate' })]),
        wrap
      ]);
    }
    return { stage, scroller, parts };
  }

  // One content page. On "ai" pages the widget replaces the native scrollbar; on "regular" pages
  // nothing extra is loaded and no AI call is made.
  function contentPage(page, isLast) {
    return () => {
      const kind = page === 'chat' ? 'conversation' : 'document';
      const mode = STATE.cond[page];
      const { stage: inner, scroller, parts } = renderContent(CONTENT[page], kind);
      const toolbarHost = el('div', { class: 'toolbar-host' });
      const stage = el('div', { class: 'stage' + (mode === 'regular' ? ' stage-plain' : '') }, [inner]);

      const wrap = el('div', { class: 'content-screen' }, [
        mode === 'ai' ? toolbarHost : null,
        stage,
        el('div', { class: 'studybar' }, [
          el('span', { class: 'studybar-where', text: P[page].eyebrow + ' · ' + P[page].title }),
          el('button', { class: 'btn btn-sm', type: 'button', onclick: next }, isLast ? 'I\'m finished →' : 'Go to page 2 →')
        ])
      ]);

      if (mode === 'ai') requestAnimationFrame(() => {
        STATE.widget = new window.ScrollWidget(scroller, parts, kind, toolbarHost);
      });
      return wrap;
    };
  }

  /* ===================== session assembly ===================== */

  function startSession(session, cond) {
    STATE.session = session;
    STATE.cond = cond;
    STATE.screens = [
      welcomeScreen,
      introScreen('chat'), contentPage('chat', false),
      introScreen('doc'), contentPage('doc', true),
      endScreen
    ];
    show(0);
  }

  /* ===================== boot ===================== */

  const params = new URLSearchParams(location.search);
  const s = parseInt(params.get('s'), 10);
  const pick = (v) => (v === 'ai' || v === 'regular' ? v : null);
  const chat = pick(params.get('chat')), doc = pick(params.get('doc'));
  // ?page=chat or ?page=doc jumps straight to that page — handy for rehearsing.
  const jump = params.get('page');

  if (s >= 1 || chat || doc) {
    const base = defaultCond(s >= 1 ? s : 1);
    startSession(s >= 1 ? s : 1, { chat: chat || base.chat, doc: doc || base.doc });
    if (jump === 'chat') show(2);
    else if (jump === 'doc') show(4);
  } else {
    STATE.screens = [setupScreen];
    show(0);
  }

  // exposed for checks only; holds no participant data
  window.STUDY_APP = { defaultCond, STATE };
})();
