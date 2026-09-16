// Site adapters. An adapter tells the core where the scrollable content is and turns the page into
// "chunks": {id, el, type, label, text, turn, role, lang}. Types: prompt, answer, code, image, table, heading, para.
(() => {
  const SW = window.SW, U = SW.util;

  const MSG_SEL = '[data-message-author-role]';
  // ignore mutations caused by our own overlays / chips / spacer
  const pageChange = (cb) => (records) => { if (records.some(r => !U.isOurs(r.target) && ![...r.addedNodes].every(n => n.nodeType === 1 && n.classList && (n.classList.contains('sw-ui') || n.classList.contains('sw-ref'))))) cb(); };
  const BIG_IMG = (el) => { const r = el.getBoundingClientRect(); return r.width >= 80 && r.height >= 60; };

  function codeLang(pre) {
    const c = pre.querySelector('code');
    const m = ((c && c.className) || pre.className || '').match(/language-([a-z0-9+#]+)/i);
    return m ? m[1] : (pre.dataset.lang || null);
  }
  function artifactsIn(root, ctx, out) {
    root.querySelectorAll('pre').forEach(pre => {
      if (U.isOurs(pre) || pre.closest('.sw-pinbody')) return;
      const lines = (pre.innerText || '').split('\n').map(l => l.trim()).filter(l => l.length > 8);
      out.push({ id: U.uid('c'), el: pre, type: 'code', lang: codeLang(pre), label: pre.dataset.label || null, text: U.text(pre).slice(0, 2000), lines, ...ctx });
    });
    root.querySelectorAll('img, svg[role="img"], figure').forEach(im => {
      if (U.isOurs(im) || im.closest('.sw-pinbody')) return;
      if (im.tagName !== 'FIGURE' && im.closest('figure')) return; // the figure will represent it
      if (im.tagName !== 'FIGURE' && !BIG_IMG(im)) return;
      const cap = im.querySelector && im.querySelector('figcaption');
      const alt = im.getAttribute('alt') || im.getAttribute('aria-label') || (cap && U.text(cap)) || '';
      out.push({ id: U.uid('c'), el: im, type: 'image', label: im.dataset.label || null, alt, text: alt, ...ctx });
    });
    root.querySelectorAll('table').forEach(t => {
      if (U.isOurs(t) || t.closest('.sw-pinbody')) return;
      const heads = [...t.querySelectorAll('th')].map(U.text).filter(Boolean);
      out.push({ id: U.uid('c'), el: t, type: 'table', label: t.dataset.label || null, heads, text: U.text(t).slice(0, 2000), ...ctx });
    });
  }

  // ----- ChatGPT (real chatgpt.com and the fixture page use the same DOM contract) -----
  const chatgpt = {
    name: 'chatgpt',
    matches: () => /chatgpt\.com|chat\.openai\.com/.test(location.host) || !!document.querySelector(MSG_SEL),
    ready: () => document.querySelectorAll(MSG_SEL).length > 0,
    scrollerEl: () => U.scrollParent(document.querySelector(MSG_SEL)),
    messages: () => [...document.querySelectorAll(MSG_SEL)].filter(m => !U.isOurs(m) && !m.closest('.sw-pinbody')),
    getChunks() {
      const out = [];
      this.messages().forEach((m, i) => {
        const role = m.getAttribute('data-message-author-role');
        const turn = i + 1;
        const text = U.text(m).slice(0, 4000);
        const type = role === 'user' ? 'prompt' : 'answer';
        m.dataset.swTurn = turn;
        const h = m.querySelector('h1,h2,h3,h4');
        const chunk = { id: U.uid('m'), el: m, type, role, turn, label: m.dataset.label || null, headline: h ? U.text(h) : null, text };
        out.push(chunk);
        if (role !== 'user') { const n = out.length; artifactsIn(m, { turn, role }, out); chunk.hasArtifacts = out.length > n; }
      });
      return out;
    },
    messageOf: (el) => el.closest(MSG_SEL),
    onChange(cb) {
      // observe the whole body: on chatgpt.com the thread element itself is replaced when switching chats
      new MutationObserver(pageChange(U.debounce(cb, 600))).observe(document.body, { childList: true, subtree: true });
    },
    hasPrompts: true
  };

  // ----- Generic long page (articles, docs, the fixture article / book) -----
  const article = {
    name: 'article',
    matches: () => true,
    ready: () => !!document.body,
    scrollerEl: () => document.scrollingElement || document.documentElement,
    root: () => document.querySelector('main, article, [role="main"]') || document.body,
    getChunks() {
      const out = [], root = this.root();
      root.querySelectorAll('h1,h2,h3,h4').forEach(h => {
        if (U.isOurs(h) || h.closest('.sw-pinbody')) return;
        out.push({ id: U.uid('h'), el: h, type: 'heading', level: +h.tagName[1], label: h.dataset.label || U.text(h), text: U.text(h) });
      });
      artifactsIn(root, {}, out);
      root.querySelectorAll('p, li').forEach(p => {
        if (U.isOurs(p) || p.closest('.sw-pinbody') || p.closest('pre, table, figure')) return;
        const t = U.text(p);
        if (t.split(' ').length < 12) return;
        out.push({ id: U.uid('p'), el: p, type: 'para', label: p.dataset.label || null, text: t.slice(0, 2000) });
      });
      // keep document order
      out.sort((a, b) => (a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING) ? -1 : 1);
      return out;
    },
    messageOf: () => null,
    onChange(cb) { new MutationObserver(pageChange(U.debounce(cb, 800))).observe(this.root(), { childList: true, subtree: true }); },
    hasPrompts: false
  };

  SW.adapters = [chatgpt, article];
  SW.pickAdapter = () => SW.adapters.find(a => a.matches());
})();
