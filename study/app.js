/* Study runner for "Including Artificial Intelligence in a UI Widget: Intelligent Scrolling"
 * (CMU STUDY2026-00000426) — moderated version.
 *
 * The researcher reads every task aloud from the session script. The website only shows context,
 * the two long pages, and a button to move on. Flow:
 *
 *   introduction (one page) → conversation → article → end
 *
 * Both pages always show the AI scrolling tool. ?page=chat or ?page=doc jumps straight to a page.
 *
 * IRB constraints respected here:
 *   - Nothing is stored. No localStorage/sessionStorage/IndexedDB/cookies, no database.
 *   - No analytics or interaction logging of any kind.
 *   - No name, email, session code, or personal field anywhere.
 *   - The only network call is the widget's POST /api/claude, carrying study content and the
 *     participant's typed search text.
 *   - All state lives in the STATE object below, so a refresh clears everything.
 *   - No window.alert/confirm/prompt, no pop-ups, no new tabs, no keyboard shortcuts.
 */
(() => {
  'use strict';

  const P = window.STUDY_PAGES;
  const CONTENT = window.STUDY_CONTENT;

  // ---- in-memory state only ----
  const STATE = { screens: [], at: 0, widget: null };

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

  /* ===================== participant screens ===================== */

  // One-page introduction. Clicking Start opens the conversation and the testing begins.
  const welcomeScreen = () => panel([
    el('p', { class: 'eyebrow', text: P.welcome.eyebrow }),
    el('h1', { text: P.welcome.title }),
    el('p', { class: 'lede', text: P.welcome.lede }),
    ...P.welcome.blocks.map(b => el('div', { class: 'intro-block' }, [
      el('h2', { text: b.heading }),
      ...b.paras.map(t => el('p', { text: t }))
    ])),
    el('p', { class: 'fineprint', text: P.welcome.note }),
    el('div', { class: 'actions' }, [primary(P.welcome.start, next)])
  ], true);

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
    // Back and search sit on the right of this page's own title bar.
    const tools = el('div', { class: 'head-tools' });

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
          el('div', { class: 'chat-head' }, [el('span', { class: 'chat-title', text: data.title }), tools]),
          wrap,
          // decorative: inert and unfocusable, so a participant cannot type into it.
          el('div', { class: 'chat-composer', 'aria-hidden': 'true' }, [el('span', { text: 'Message the assistant…' })])
        ])
      ]);
    } else {
      stage = el('div', { class: 'docapp' }, [
        el('div', { class: 'doc-head' }, [
          el('span', { class: 'doc-site', text: 'The Long Read' }),
          el('span', { class: 'doc-section', text: 'Cities · Climate' }),
          tools
        ]),
        wrap
      ]);
    }
    return { stage, scroller, parts, tools };
  }

  // One content page, with the AI scrolling tool in place of the native scrollbar.
  function contentPage(page, isLast) {
    return () => {
      const kind = page === 'chat' ? 'conversation' : 'document';
      const { stage: inner, scroller, parts, tools } = renderContent(CONTENT[page], kind);
      const stage = el('div', { class: 'stage' }, [inner]);

      const wrap = el('div', { class: 'content-screen' }, [
        stage,
        el('div', { class: 'studybar' }, [
          el('span', { class: 'studybar-where', text: P[page].eyebrow + ' · ' + P[page].title }),
          el('button', { class: 'btn btn-sm', type: 'button', onclick: next }, isLast ? 'I\'m finished →' : 'Go to page 2: the article →')
        ])
      ]);

      requestAnimationFrame(() => {
        STATE.widget = new window.ScrollWidget(scroller, parts, kind, tools);
      });
      return wrap;
    };
  }

  /* ===================== session assembly + boot ===================== */

  STATE.screens = [
    welcomeScreen,
    contentPage('chat', false),
    contentPage('doc', true),
    endScreen
  ];

  // ?page=chat or ?page=doc jumps straight to that page — handy for rehearsing.
  const jump = new URLSearchParams(location.search).get('page');
  show(jump === 'chat' ? 1 : jump === 'doc' ? 2 : 0);

  // exposed for checks only; holds no participant data
  window.STUDY_APP = { STATE };
})();
