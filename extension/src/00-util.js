// Shared namespace, helpers, settings, scroller abstraction, event bus, AI bridge.
(() => {
  if (window.SW && window.SW.__loaded) return; // injected twice (toolbar click on a matched page)
  const SW = (window.SW = window.SW || {});
  SW.__loaded = true;
  SW.log = (...a) => console.log('%c[SW]', 'color:#7c5cff', ...a);

  // ---------- small helpers ----------
  const U = (SW.util = {});
  U.uid = (() => { let n = 0; return (p = 'sw') => `${p}${++n}`; })();
  U.clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  U.debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  U.throttle = (fn, ms) => { let last = 0, t; return (...a) => { const now = Date.now(); const rem = ms - (now - last);
    if (rem <= 0) { last = now; fn(...a); } else { clearTimeout(t); t = setTimeout(() => { last = Date.now(); fn(...a); }, rem); } }; };
  U.text = (el) => (el ? (el.innerText || el.textContent || '') : '').replace(/\s+/g, ' ').trim();
  U.firstWords = (s, n = 6) => { const w = (s || '').split(' ').filter(Boolean); return w.slice(0, n).join(' ') + (w.length > n ? '…' : ''); };
  U.esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  U.el = (tag, attrs = {}, children = []) => {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'class') e.className = v;
      else if (k === 'style') e.style.cssText = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k === 'text') e.textContent = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v);
    }
    for (const c of [].concat(children)) if (c != null) e.append(c.nodeType ? c : document.createTextNode(String(c)));
    return e;
  };
  U.isOurs = (el) => !!(el && el.closest && el.closest('.sw-ui'));
  U.scrollParent = (el) => {
    let n = el && el.parentElement;
    while (n && n !== document.body && n !== document.documentElement) {
      const cs = getComputedStyle(n);
      if (/(auto|scroll)/.test(cs.overflowY) && n.scrollHeight > n.clientHeight + 10) return n;
      n = n.parentElement;
    }
    return document.scrollingElement || document.documentElement;
  };
  U.store = {
    get(k, d) { try { const v = localStorage.getItem('sw:' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) { try { localStorage.setItem('sw:' + k, JSON.stringify(v)); } catch {} }
  };
  U.isMac = /Mac|iPhone|iPad/.test(navigator.platform);
  U.stem = (w) => w.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/(ies)$/, 'y').replace(/(ing|ed|es|s)$/, '');
  U.STOP = new Set(['the', 'a', 'an', 'of', 'to', 'in', 'on', 'for', 'and', 'or', 'is', 'it', 'that', 'this', 'with', 'as', 'at', 'by', 'be', 'was', 'are', 'from', 'we', 'i', 'you', 'my', 'me', 'do', 'did', 'does', 'one', 'about', 'where', 'which', 'what', 'how', 'show', 'find', 'thing', 'part']);
  U.tokens = (s) => (s || '').toLowerCase().split(/[^a-z0-9_]+/).filter(t => t.length > 1 && !U.STOP.has(t)).map(U.stem).filter(Boolean);

  // ---------- event bus ----------
  const handlers = {};
  SW.bus = {
    on(ev, fn) { (handlers[ev] = handlers[ev] || []).push(fn); },
    emit(ev, ...a) { (handlers[ev] || []).forEach(fn => { try { fn(...a); } catch (e) { SW.log('handler error', ev, e); } }); }
  };

  // ---------- settings / presets ----------
  const PRESETS = {
    P1: { markers: true, find: true, ticker: true, waypoints: true, pins: false, refs: false, regions: true },
    P2: { markers: false, find: false, ticker: false, waypoints: true, pins: false, refs: true, regions: false },
    P3: { markers: false, find: false, ticker: false, waypoints: true, pins: true, refs: false, regions: false },
    ALL: { markers: true, find: true, ticker: true, waypoints: true, pins: true, refs: true, regions: true }
  };
  SW.PRESETS = PRESETS;
  // Settings are scoped to the PAGE, not the origin: two fixtures served from the same localhost
  // must be able to hold different presets (chat demo vs. document demo). The API key stays
  // origin-wide so it only has to be pasted once per host.
  const SKEY = 'settings@' + location.pathname;
  const saved = U.store.get(SKEY, null) || U.store.get('settings', {}); // migrate old origin-wide value
  SW.settings = Object.assign({ preset: 'ALL', tickerSpeed: 1.5 }, PRESETS.ALL, saved);
  const persist = () => U.store.set(SKEY, SW.settings);
  SW.applyPreset = (name) => {
    Object.assign(SW.settings, PRESETS[name], { preset: name });
    persist();
    SW.bus.emit('settings');
  };
  SW.setSetting = (k, v) => { SW.settings[k] = v; SW.settings.preset = 'CUSTOM'; persist(); SW.bus.emit('settings'); };

  // ---------- scroller abstraction (window or an inner scrolling element, e.g. the ChatGPT thread) ----------
  SW.Scroller = class {
    constructor(el) {
      this.el = el;
      this.isWindow = !el || el === document.scrollingElement || el === document.documentElement || el === document.body;
    }
    get top() { return this.isWindow ? window.scrollY : this.el.scrollTop; }
    set top(v) { if (this.isWindow) window.scrollTo(0, v); else this.el.scrollTop = v; }
    get height() { return this.isWindow ? window.innerHeight : this.el.clientHeight; }
    get scrollHeight() { return this.isWindow ? document.documentElement.scrollHeight : this.el.scrollHeight; }
    rect() { return this.isWindow ? { top: 0, left: 0, right: window.innerWidth, bottom: window.innerHeight, width: window.innerWidth, height: window.innerHeight } : this.el.getBoundingClientRect(); }
    // y of an element measured from the top of the scrollable content
    offsetOf(el) { const r = el.getBoundingClientRect(); return r.top - this.rect().top + this.top; }
    on(fn) { (this._fns = this._fns || []).push(fn); (this.isWindow ? window : this.el).addEventListener('scroll', fn, { passive: true }); }
    // SPA pages (ChatGPT) replace the thread element when you switch chats: move the listeners over
    rebind(el) { this.el = el; (this._fns || []).forEach(fn => el.addEventListener('scroll', fn, { passive: true })); }
    // Own animation instead of behavior:'smooth' — native smooth scrolls get cancelled by re-renders
    // (ChatGPT) and don't tick at all in some background/automated tabs.
    scrollTo(y, smooth = true, ms = 420) {
      clearInterval(this._anim);
      const to = U.clamp(y, 0, Math.max(0, this.scrollHeight - this.height));
      if (!smooth) { this.top = to; return Promise.resolve(); }
      const from = this.top, t0 = performance.now();
      const ease = (t) => 1 - Math.pow(1 - t, 3);
      return new Promise(resolve => {
        this._anim = setInterval(() => {
          const t = Math.min(1, (performance.now() - t0) / ms);
          this.top = from + (to - from) * ease(t);
          if (t >= 1) { clearInterval(this._anim); resolve(); }
        }, 16);
      });
    }
    contentEl() { return this.isWindow ? document.body : this.el; }
  };

  // ---------- AI bridge ----------
  // In the extension, calls go through background.js (key in chrome.storage). In ?dev mode (no extension),
  // the page calls the API directly with a key kept in localStorage — the API permits browser calls.
  const inExtension = () => { try { return !!(chrome.runtime && chrome.runtime.id); } catch { return false; } };
  SW.ai = {
    hasKey: null,
    direct: !inExtension(),
    directKey() { return U.store.get('claudeKey', ''); },
    setDirectKey(k) { U.store.set('claudeKey', k); this.hasKey = null; this.check(); },
    async check() {
      if (this.hasKey != null) return this.hasKey;
      if (this.direct) this.hasKey = !!this.directKey();
      else {
        try { const r = await chrome.runtime.sendMessage({ type: 'sw-haskey' }); this.hasKey = !!(r && r.ok); }
        catch { this.hasKey = false; }
      }
      SW.bus.emit('ai-status', this.hasKey);
      return this.hasKey;
    },
    async call(task, payload) {
      if (!(await this.check())) return null;
      try {
        const r = this.direct ? await self.SW_AI.callClaude(this.directKey(), task, payload)
                              : await chrome.runtime.sendMessage({ type: 'sw-ai', task, payload });
        if (!r || !r.ok) { SW.log('AI call failed', task, r); this.lastError = r && (r.reason + (r.detail ? ': ' + String(r.detail).slice(0, 200) : '')); SW.bus.emit('ai-status', this.hasKey); return null; }
        this.lastError = null;
        return r.result;
      } catch (e) { SW.log('AI bridge error', e); this.lastError = String(e); return null; }
    }
  };

  SW.TYPE_ICON = { prompt: '💬', answer: '🤖', code: '{ }', image: '🖼', table: '▦', heading: '§', figure: '🖼', para: '¶' };
})();
