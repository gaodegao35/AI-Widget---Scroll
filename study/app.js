/* Study runner for "Including Artificial Intelligence in a UI Widget: Intelligent Scrolling"
 * (CMU STUDY2026-00000426).
 *
 * IRB constraints respected here:
 *   - Nothing is stored. No localStorage/sessionStorage/IndexedDB/cookies, no database, no network
 *     call carrying participant input except the search text, which goes to /api/claude.
 *   - No analytics or interaction logging of any kind.
 *   - No name, email, or personal field anywhere. The session number is researcher-entered, used to
 *     compute the order, and never sent anywhere.
 *   - All state lives in the STATE object below, so a refresh clears everything.
 *   - No window.alert/confirm/prompt, no pop-ups, no new tabs.
 */
(() => {
  'use strict';

  const T = window.STUDY_TASKS;
  const CONTENT = window.STUDY_CONTENT;
  const TASK_LIMIT_MS = 120000; // 2:00 per timed task

  // ---- in-memory state only ----
  const STATE = {
    phase: null, session: null, order: null,
    screens: [], at: 0,
    answers: {},      // feedback/interview text, by key
    sus: {},          // sus ratings, by key
    widget: null
  };

  const app = document.getElementById('app');
  const el = (tag, attrs = {}, kids = []) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k === 'html') n.innerHTML = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else if (v !== null && v !== undefined && v !== false) n.setAttribute(k, v === true ? '' : v);
    }
    for (const c of [].concat(kids)) if (c != null && c !== false) n.append(c.nodeType ? c : document.createTextNode(String(c)));
    return n;
  };

  /* ===================== order ===================== */

  const PHASE2_ORDERS = {
    1: [{ cond: 'IS', set: 'A' }, { cond: 'CS', set: 'B' }],
    2: [{ cond: 'CS', set: 'A' }, { cond: 'IS', set: 'B' }],
    3: [{ cond: 'IS', set: 'B' }, { cond: 'CS', set: 'A' }],
    4: [{ cond: 'CS', set: 'B' }, { cond: 'IS', set: 'A' }]
  };

  function computeOrder(phase, session) {
    if (phase === 1) {
      const first = session % 2 === 1 ? 'conversation' : 'document';
      return { kind: 'phase1', first, second: first === 'conversation' ? 'document' : 'conversation' };
    }
    const n = ((session - 1) % 4) + 1;
    return { kind: 'phase2', n, conditions: PHASE2_ORDERS[n] };
  }

  /* ===================== screen plumbing ===================== */

  function show(i) {
    if (STATE.widget) { STATE.widget.destroy(); STATE.widget = null; }
    STATE.at = Math.max(0, Math.min(i, STATE.screens.length - 1));
    app.textContent = '';
    app.scrollTop = 0;
    const node = STATE.screens[STATE.at]();
    app.append(node);
    // move focus to the heading of a card screen only; content pages keep focus on the page itself
    const heading = node.querySelector('.card h1');
    if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({ preventScroll: true }); }
    else { const sc = node.querySelector('.page-scroll'); if (sc) sc.focus({ preventScroll: true }); }
  }
  const next = () => show(STATE.at + 1);

  const panel = (kids) => el('div', { class: 'screen' }, [el('div', { class: 'card' }, kids)]);
  const primary = (label, onclick) => el('button', { class: 'btn btn-primary', type: 'button', onclick }, label);

  /* ===================== researcher setup ===================== */

  function setupScreen() {
    let phase = 1, session = 1;
    const summary = el('div', { class: 'order-summary' });

    const render = () => {
      const order = computeOrder(phase, session);
      summary.textContent = '';
      if (order.kind === 'phase1') {
        summary.append(
          el('div', { class: 'order-line' }, [el('b', { text: 'Session ' + session }), ` · Phase 1 · ${session % 2 === 1 ? 'odd' : 'even'} number`]),
          el('ol', { class: 'order-list' }, [
            el('li', { text: `First page: ${order.first}` }),
            el('li', { text: `Second page: ${order.second}` }),
            el('li', { text: 'Both pages use Set A content with the AI tool on.' })
          ])
        );
      } else {
        summary.append(
          el('div', { class: 'order-line' }, [el('b', { text: 'Session ' + session }), ` · Phase 2 · order ${order.n} of 4`]),
          el('ol', { class: 'order-list' }, order.conditions.map((c, i) =>
            el('li', { text: `${i === 0 ? 'First' : 'Second'} condition: ${c.cond === 'IS' ? 'Intelligent Scrolling (AI tool)' : 'Conventional Scrolling (baseline)'} with Set ${c.set}` })
          ))
        );
      }
    };

    const sessionInput = el('input', {
      class: 'field', type: 'number', min: '1', step: '1', value: '1', id: 'session-number',
      oninput: (e) => { session = Math.max(1, parseInt(e.target.value, 10) || 1); render(); }
    });

    const phaseRadios = [1, 2].map(p => el('label', { class: 'radio' }, [
      el('input', {
        type: 'radio', name: 'phase', value: String(p), checked: p === 1,
        onchange: () => { phase = p; render(); }
      }),
      el('span', { text: `Phase ${p}` })
    ]));

    render();
    return panel([
      el('p', { class: 'eyebrow', text: 'Researcher setup' }),
      el('h1', { text: 'Intelligent Scrolling study' }),
      el('p', { class: 'lede', text: 'Set the phase and session number before you send the link or share your screen. Nothing on this screen is stored.' }),
      el('div', { class: 'field-row' }, [
        el('div', {}, [el('span', { class: 'field-label', text: 'Phase' }), el('div', { class: 'radio-row' }, phaseRadios)]),
        el('div', {}, [el('label', { class: 'field-label', for: 'session-number', text: 'Session number' }), sessionInput])
      ]),
      summary,
      el('div', { class: 'actions' }, [
        primary('Start session', () => startSession(phase, session))
      ]),
      el('p', { class: 'fineprint' }, [
        'You can also open a ready-made link, for example ',
        el('code', { text: '?phase=2&s=7' }),
        '. The link holds no personal information.'
      ])
    ]);
  }

  /* ===================== shared screens ===================== */

  const checklistScreen = () => panel([
    el('h1', { text: 'Before we begin' }),
    el('p', { class: 'body', text: T.text.checklist }),
    el('div', { class: 'actions' }, [primary("I'm ready", next)])
  ]);

  const introScreen = (which) => () => panel([
    el('h1', { text: 'About this session' }),
    el('p', { class: 'body', text: which === 1 ? T.text.introPhase1 : T.text.introPhase2 }),
    el('div', { class: 'actions' }, [primary(which === 1 ? 'Begin' : 'Begin', next)])
  ]);

  const breakScreen = () => panel([
    el('h1', { text: 'Break' }),
    el('p', { class: 'body', text: T.text.breakText }),
    el('div', { class: 'actions' }, [primary('Continue', next)])
  ]);

  function questionsScreen(title, intro, questions, keyPrefix) {
    return () => panel([
      el('h1', { text: title }),
      el('p', { class: 'body', text: intro }),
      el('ol', { class: 'questions' }, questions.map((q, i) => {
        const key = keyPrefix + i;
        return el('li', {}, [
          el('label', { class: 'q-text', for: key, text: q }),
          el('textarea', {
            class: 'field textarea', id: key, rows: '3', placeholder: 'Optional',
            oninput: (e) => { STATE.answers[key] = e.target.value; }
          })
        ]);
      })),
      el('p', { class: 'fineprint', text: 'Nothing here is saved or submitted. Refreshing the page clears it.' }),
      el('div', { class: 'actions' }, [primary('Continue', next)])
    ]);
  }

  function susScreen(label) {
    return () => {
      STATE.sus = {}; // reset for each condition
      const scale = ['1 Strongly disagree', '2', '3', '4', '5 Strongly agree'];
      return panel([
        el('h1', { text: 'Please rate the version you just used.' }),
        el('p', { class: 'fineprint', text: 'Nothing here is saved or submitted.' }),
        el('ol', { class: 'sus' }, T.susStatements.map((s, i) => el('li', {}, [
          el('span', { class: 'sus-text', text: s }),
          el('div', { class: 'sus-scale', role: 'radiogroup', 'aria-label': s }, scale.map((lab, v) =>
            el('label', { class: 'sus-opt' }, [
              el('input', {
                type: 'radio', name: `sus-${label}-${i}`, value: String(v + 1),
                onchange: () => { STATE.sus[`${label}-${i}`] = v + 1; }
              }),
              el('span', { text: String(v + 1) }),
              el('span', { class: 'sus-end', text: v === 0 ? 'Strongly disagree' : v === 4 ? 'Strongly agree' : '' })
            ])
          ))
        ]))),
        el('div', { class: 'actions' }, [primary('Continue', next)])
      ]);
    };
  }

  const endScreen = () => {
    const card = panel([
      el('h1', { text: T.text.thanks }),
      el('p', { class: 'body', text: 'Nothing you typed was saved. You can clear it from the screen now.' }),
      el('div', { class: 'actions' }, [
        el('button', {
          class: 'btn', type: 'button', onclick: () => {
            STATE.answers = {}; STATE.sus = {};
            card.querySelector('.cleared').hidden = false;
          }
        }, 'Clear my answers')
      ]),
      el('p', { class: 'fineprint cleared', hidden: true, text: 'Cleared. Refreshing the page also clears everything.' })
    ]);
    return card;
  };

  /* ===================== content pages ===================== */

  // Build the readable page and the list of parts the widget navigates.
  function renderContent(data, kind) {
    const parts = [];
    const scroller = el('div', { class: 'page-scroll', tabindex: '0' });
    const inner = el('article', { class: 'page-inner page-' + kind });

    if (kind === 'conversation') {
      inner.append(el('h1', { class: 'page-title', text: data.title }));
      const msgs = data.messages;
      for (let i = 0; i < msgs.length; i += 2) {
        const pair = msgs.slice(i, i + 2);
        const block = el('div', { class: 'exchange' }, pair.map(m =>
          el('div', { class: 'msg msg-' + m.role }, [
            el('span', { class: 'who', text: m.role === 'user' ? 'You' : 'Assistant' }),
            el('div', { class: 'bubble' }, m.text.split('\n\n').map(t => el('p', { text: t })))
          ])
        ));
        inner.append(block);
        parts.push({ id: 'p' + (parts.length + 1), el: block, heading: '', text: pair.map(m => `${m.role === 'user' ? 'Person' : 'Assistant'}: ${m.text}`).join('\n') });
      }
    } else {
      inner.append(
        el('h1', { class: 'page-title', text: data.title }),
        data.subtitle ? el('p', { class: 'page-sub', text: data.subtitle }) : null
      );
      data.sections.forEach((s) => {
        const block = el('section', { class: 'docsec' }, [
          el('h2', { text: s.heading }),
          ...s.paras.map(t => el('p', { text: t }))
        ]);
        inner.append(block);
        parts.push({ id: 'p' + (parts.length + 1), el: block, heading: s.heading, text: s.paras.join('\n\n') });
      });
    }

    scroller.append(inner);
    return { scroller, parts };
  }

  /* ---- Phase 1: one page, four untimed tasks ---- */
  function phase1Page(set, kind) {
    return () => {
      const data = CONTENT[set][kind];
      const { scroller, parts } = renderContent(data, kind);
      const stage = el('div', { class: 'stage' }, [scroller]);
      const tasks = kind === 'conversation' ? T.phase1.conversation : T.phase1.document;
      let i = 0;

      const taskText = el('p', { class: 'task-text' });
      const taskNum = el('span', { class: 'task-num' });
      const nextBtn = el('button', { class: 'btn btn-primary btn-sm', type: 'button', onclick: () => {
        if (i < tasks.length - 1) { i++; paint(); } else next();
      } }, 'Next task');

      function paint() {
        taskNum.textContent = `Task ${i + 1} of ${tasks.length}`;
        taskText.textContent = tasks[i].text;
        nextBtn.textContent = i < tasks.length - 1 ? 'Next task' : 'Finish this page';
      }
      paint();

      const wrap = el('div', { class: 'content-screen' }, [
        stage,
        el('div', { class: 'taskpanel', role: 'region', 'aria-label': 'Current task' }, [taskNum, taskText, el('div', { class: 'taskpanel-actions' }, [nextBtn])])
      ]);

      requestAnimationFrame(() => { STATE.widget = new window.ScrollWidget(scroller, parts, kind); });
      return wrap;
    };
  }

  /* ---- Phase 2: practice page ---- */
  function practicePage(cond) {
    return () => {
      const data = CONTENT.PRACTICE.conversation;
      const { scroller, parts } = renderContent(data, 'conversation');
      const stage = el('div', { class: 'stage' + (cond === 'CS' ? ' stage-plain' : '') }, [scroller]);
      const wrap = el('div', { class: 'content-screen' }, [
        stage,
        el('div', { class: 'taskpanel', role: 'region', 'aria-label': 'Practice' }, [
          el('span', { class: 'task-num', text: 'Practice · about 2 minutes' }),
          el('p', { class: 'task-text', text: cond === 'IS' ? T.text.practiceIS : T.text.practiceCS }),
          el('div', { class: 'taskpanel-actions' }, [
            el('button', { class: 'btn btn-primary btn-sm', type: 'button', onclick: next }, "I'm ready to start the tasks")
          ])
        ])
      ]);
      if (cond === 'IS') requestAnimationFrame(() => { STATE.widget = new window.ScrollWidget(scroller, parts, 'conversation'); });
      return wrap;
    };
  }

  /* ---- Phase 2: one page, four timed tasks ---- */
  function phase2Page(set, kind, cond) {
    return () => {
      const data = CONTENT[set][kind];
      const sheet = T.sheet[`${set}.${kind}`];
      const texts = [
        T.phase2Templates.t1.replace('[TARGET1]', sheet.target1),
        T.phase2Templates.t2.replace('[TARGET2]', sheet.target2),
        T.phase2Templates.t3.replace('[QUESTION]', sheet.question),
        T.phase2Templates.t4
      ];

      const { scroller, parts } = renderContent(data, kind);
      const stage = el('div', { class: 'stage' + (cond === 'CS' ? ' stage-plain' : '') }, [scroller]);
      const cover = el('div', { class: 'cover' }, [el('span', { text: 'The page is covered until you start.' })]);
      stage.append(cover);

      let i = 0, t0 = 0, elapsed = 0, ticker = null, running = false;

      const taskNum = el('span', { class: 'task-num' });
      const taskText = el('p', { class: 'task-text' });
      const clock = el('span', { class: 'clock', role: 'timer', 'aria-live': 'off', text: '0:00' });
      const actions = el('div', { class: 'taskpanel-actions' });
      const note = el('p', { class: 'task-note', hidden: true });

      const fmt = (ms) => {
        const s = Math.floor(ms / 1000);
        return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
      };

      function tick() {
        const ms = elapsed + (performance.now() - t0);
        if (ms >= TASK_LIMIT_MS) { clock.textContent = '2:00'; timeUp(); return; }
        clock.textContent = fmt(ms);
      }
      function startTimer() {
        running = true; t0 = performance.now();
        clearInterval(ticker); ticker = setInterval(tick, 200); tick();
      }
      function stopTimer() {
        if (running) { elapsed += performance.now() - t0; running = false; }
        clearInterval(ticker);
      }
      function timeUp() {
        stopTimer();
        cover.hidden = false;
        cover.textContent = '';
        cover.append(el('span', { text: "Time's up, let's move on." }));
        note.hidden = false;
        note.textContent = "Time's up, let's move on.";
        renderActions('timeup');
      }

      function renderActions(mode) {
        actions.textContent = '';
        if (mode === 'ready') {
          actions.append(el('button', { class: 'btn btn-primary btn-sm', type: 'button', onclick: begin }, 'Start'));
        } else if (mode === 'running') {
          actions.append(el('button', { class: 'btn btn-primary btn-sm', type: 'button', onclick: foundIt }, 'Found it / Done'));
        } else if (mode === 'paused') {
          actions.append(
            el('button', { class: 'btn btn-sm', type: 'button', onclick: resume }, 'Continue'),
            el('button', { class: 'btn btn-primary btn-sm', type: 'button', onclick: advance }, i < texts.length - 1 ? 'Next task' : 'Finish this page')
          );
        } else {
          actions.append(el('button', { class: 'btn btn-primary btn-sm', type: 'button', onclick: advance }, i < texts.length - 1 ? 'Next task' : 'Finish this page'));
        }
      }

      function paint() {
        taskNum.textContent = `Task ${i + 1} of ${texts.length}`;
        taskText.textContent = texts[i];
        note.hidden = true;
        elapsed = 0; running = false; clearInterval(ticker);
        clock.textContent = '0:00';
        cover.hidden = false;
        cover.textContent = '';
        cover.append(el('span', { text: 'The page is covered until you start.' }));
        renderActions('ready');
      }

      function begin() {
        // Only Task 1 returns the page to the top. Task 4 in particular must not reset it.
        if (i === 0) scroller.scrollTop = 0;
        cover.hidden = true;
        startTimer();
        renderActions('running');
        scroller.focus({ preventScroll: true });
      }
      function foundIt() { stopTimer(); renderActions('paused'); }
      function resume() { startTimer(); renderActions('running'); }
      function advance() {
        stopTimer();
        if (i < texts.length - 1) { i++; paint(); }   // the elapsed time is discarded, never stored
        else next();
      }

      paint();

      const wrap = el('div', { class: 'content-screen' }, [
        stage,
        el('div', { class: 'taskpanel', role: 'region', 'aria-label': 'Current task' }, [
          el('div', { class: 'taskpanel-head' }, [taskNum, clock]),
          taskText, note, actions
        ])
      ]);

      if (cond === 'IS') requestAnimationFrame(() => { STATE.widget = new window.ScrollWidget(scroller, parts, kind); });
      return wrap;
    };
  }

  /* ===================== session assembly ===================== */

  function startSession(phase, session) {
    STATE.phase = phase;
    STATE.session = session;
    STATE.order = computeOrder(phase, session);
    STATE.answers = {}; STATE.sus = {};

    const s = [checklistScreen, introScreen(phase)];
    if (phase === 1) {
      s.push(phase1Page('A', STATE.order.first));
      s.push(phase1Page('A', STATE.order.second));
      s.push(questionsScreen('Your experience', T.text.feedbackIntro, T.feedbackQuestions, 'fb'));
    } else {
      STATE.order.conditions.forEach((c, idx) => {
        s.push(practicePage(c.cond));
        s.push(phase2Page(c.set, 'conversation', c.cond));
        s.push(phase2Page(c.set, 'document', c.cond));
        s.push(susScreen(idx === 0 ? 'first' : 'second'));
        if (idx === 0) s.push(breakScreen);
      });
      s.push(questionsScreen('Your experience', T.text.interviewIntro, T.interviewQuestions, 'iv'));
    }
    s.push(endScreen);

    STATE.screens = s;
    show(0);
  }

  /* ===================== boot ===================== */

  const params = new URLSearchParams(location.search);
  const urlPhase = parseInt(params.get('phase'), 10);
  const urlSession = parseInt(params.get('s'), 10);
  if ((urlPhase === 1 || urlPhase === 2) && urlSession >= 1) {
    startSession(urlPhase, urlSession);
  } else {
    STATE.screens = [setupScreen];
    show(0);
  }

  // expose for the acceptance checks only; holds no participant data
  window.STUDY_APP = { computeOrder, STATE };
})();
