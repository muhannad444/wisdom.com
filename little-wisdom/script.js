/*
 * Little Wisdom — application logic.
 * Hash-routed single page:
 *   #/                      home
 *   #/library?cat=&tag=&q=  search + filters (state lives in the URL)
 *   #/quote/q07?cat=life    one quote; the optional query is the browsing context
 *   #/bookmarks
 * Every view renders from the same QUOTES records (English) merged with QUOTES_AR (Arabic).
 * All text is inserted with createTextNode; innerHTML is used only for our own static SVG.
 * The language (en/ar) lives in I18N; switching re-renders the current view in place.
 */
(function () {
  'use strict';

  const app = document.getElementById('app');
  const main = document.getElementById('main');
  const I18N = window.I18N;

  /* ---------- Fail visibly if the data did not load ---------- */
  if (!I18N || !Array.isArray(window.QUOTES) || !window.QUOTES.length || !window.sceneElement) {
    app.textContent = 'Sorry, the quotes could not be loaded. Please refresh the page. · للأسف ما قدرنا نحمّل الاقتباسات. حدّث الصفحة.';
    app.style.cssText = 'padding:4rem 1.25rem;text-align:center';
    return;
  }
  const t = I18N.t;

  const QUOTES = window.QUOTES.filter(function (q) { return q.published; });
  const CATEGORIES = window.CATEGORIES;
  const AR = window.QUOTES_AR || {};
  const CATEGORIES_AR = window.CATEGORIES_AR || {};
  const TAGS_AR = window.TAGS_AR || {};
  const byId = new Map(QUOTES.map(function (q) { return [q.id, q]; }));
  const pad = function (n) { return String(n).padStart(2, '0'); };
  const isAr = function () { return I18N.lang === 'ar'; };

  /* ---------- Localised views of the data (English stays the source of truth) ---------- */
  /** Title/text to display. Falls back to English (flagged with its own lang) if a translation is missing. */
  function qv(q) {
    const a = isAr() ? AR[q.id] : null;
    return a && a.text ? { title: a.title || q.title, text: a.text, lang: 'ar' } : { title: q.title, text: q.text, lang: 'en' };
  }
  /** lang/dir attributes, only when a piece of content differs from the page language. */
  function langAttrs(v) {
    return v.lang === I18N.lang ? {} : { lang: v.lang, dir: v.lang === 'ar' ? 'rtl' : 'ltr' };
  }
  function catName(id) {
    const c = CATEGORIES.find(function (k) { return k.id === id; });
    return isAr() && CATEGORIES_AR[id] ? CATEGORIES_AR[id].name : (c ? c.name : id);
  }
  function catBlurb(id) {
    const c = CATEGORIES.find(function (k) { return k.id === id; });
    return isAr() && CATEGORIES_AR[id] ? CATEGORIES_AR[id].blurb : (c ? c.blurb : '');
  }
  function tagName(tag) { return isAr() && TAGS_AR[tag] ? TAGS_AR[tag] : tag; }
  function sortedTags() {
    return allTags.slice().sort(function (a, b) { return tagName(a).localeCompare(tagName(b), I18N.lang); });
  }

  /* ---------- Tiny DOM helper ---------- */
  function h(tag, attrs) {
    const el = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      const v = attrs[k];
      if (v === null || v === undefined || v === false) return;
      if (k === 'class') el.className = v;
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    });
    Array.prototype.slice.call(arguments, 2).flat(Infinity).forEach(function (kid) {
      if (kid === null || kid === undefined || kid === false) return;
      el.append(kid.nodeType ? kid : document.createTextNode(kid));
    });
    return el;
  }

  // data-flip marks directional arrows that CSS mirrors in right-to-left layouts.
  const ICONS = {
    bookmark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h12v18l-6-4.500L6 21z"/></svg>',
    copy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8"/></svg>',
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.600 13.500 6.800 4M15.400 6.500l-6.800 4"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.500-3.500"/></svg>',
    next: '<svg data-flip viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    prev: '<svg data-flip viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
    shuffle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 3h5v5M4 20 21 3M21 16v5h-5M15 15l6 6M4 4l5 5"/></svg>'
  };
  function icon(name) { const s = document.createElement('span'); s.style.display = 'contents'; s.innerHTML = ICONS[name]; return s; }

  /** Only http(s) links are allowed as sources; anything else (e.g. javascript:) is dropped. */
  function safeUrl(value) {
    try {
      const u = new URL(value);
      return (u.protocol === 'https:' || u.protocol === 'http:') ? u.href : '';
    } catch (e) { return ''; }
  }

  /* ---------- Bookmarks: in-memory list, written through to localStorage ---------- */
  const STORE_KEY = 'littlewisdom.bookmarks.v1';
  const bookmarks = (function () {
    let ids = [];
    function load() {
      try {
        const arr = JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
        ids = Array.isArray(arr) ? arr.filter(function (id) { return byId.has(id); }) : [];
      } catch (e) { /* storage unavailable or corrupt: keep what we have in memory */ }
    }
    load();
    return {
      reload: load,
      list: function () { return ids.slice(); },
      has: function (id) { return ids.indexOf(id) !== -1; },
      toggle: function (id) {
        const i = ids.indexOf(id);
        if (i === -1) ids.push(id); else ids.splice(i, 1);
        let persisted = true;
        try { localStorage.setItem(STORE_KEY, JSON.stringify(ids)); } catch (e) { persisted = false; }
        return { saved: i === -1, persisted: persisted };
      }
    };
  })();

  /* ---------- Feedback ---------- */
  let toastTimer;
  function toast(message) {
    const el = document.getElementById('toast');
    el.textContent = message;
    el.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('is-visible'); }, 2400);
  }

  function updateBookmarkCount() {
    const n = bookmarks.list().length;
    const badge = document.getElementById('bookmark-count');
    badge.textContent = String(n);
    badge.setAttribute('aria-label', t('bookmarkCount', n));
  }

  function syncBookmarkButtons(id) {
    const saved = bookmarks.has(id);
    document.querySelectorAll('[data-bookmark="' + id + '"]').forEach(function (btn) {
      btn.setAttribute('data-saved', String(saved));
      if (btn.hasAttribute('aria-pressed')) btn.setAttribute('aria-pressed', String(saved));
      const label = btn.querySelector('.btn-label');
      if (label) label.textContent = t(saved ? 'unsave' : 'save');
      if (btn.title) btn.title = t(saved ? 'unsave' : 'save');
      if (saved) { btn.classList.remove('is-popping'); void btn.offsetWidth; btn.classList.add('is-popping'); }
    });
  }

  function onBookmark(id) {
    const result = bookmarks.toggle(id);
    updateBookmarkCount();
    syncBookmarkButtons(id);
    toast(result.persisted ? t(result.saved ? 'toast.saved' : 'toast.removed') : t('toast.noStorage'));
    if (currentRoute.name === 'bookmarks' && !result.saved) renderRoute(true);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (resolve, reject) {
      const ta = h('textarea', { 'aria-hidden': 'true', tabindex: '-1', style: 'position:fixed;opacity:0;top:0' });
      ta.value = text;
      document.body.append(ta);
      ta.select();
      try { document.execCommand('copy') ? resolve() : reject(new Error('copy failed')); }
      catch (e) { reject(e); } finally { ta.remove(); }
    });
  }

  /** Copies the quote in the language currently on screen. */
  function onCopy(id) {
    copyText(qv(byId.get(id)).text).then(
      function () { toast(t('toast.copied')); },
      function () { toast(t('toast.copyFail')); }
    );
  }

  /** A shareable address for one quote, or '' when the page is opened from a file (no real URL to share). */
  function permalink(id) {
    return /^https?:$/.test(location.protocol) ? location.href.split('#')[0] + quoteHref(id) : '';
  }

  /** Uses the phone's share sheet (WhatsApp, Messages, …) when available, otherwise copies text + link. */
  function onShare(id) {
    const text = qv(byId.get(id)).text;
    const url = permalink(id);
    function fallback() {
      copyText(text + (url ? '\n' + url : '')).then(
        function () { toast(t(url ? 'toast.linkCopied' : 'toast.copied')); },
        function () { toast(t('toast.copyFail')); }
      );
    }
    if (navigator.share) {
      const data = { title: 'Little Wisdom', text: text };
      if (url) data.url = url;
      navigator.share(data).catch(function (e) { if (!e || e.name !== 'AbortError') fallback(); });
    } else {
      fallback();
    }
  }

  /* ---------- Browsing context (which list Next/Previous walks through) ---------- */
  const FILTER_KEYS = ['cat', 'tag', 'q', 'author'];

  /** Active filters -> query string such as "cat=life&q=focus" (empty when unfiltered). */
  function filterQuery(f) {
    const p = new URLSearchParams();
    FILTER_KEYS.forEach(function (k) { if (f[k]) p.set(k, f[k]); });
    return p.toString();
  }

  function quoteHref(id, ctx) { return '#/quote/' + id + (ctx ? '?' + ctx : ''); }

  /**
   * Resolves the list a quote page steps through, from the URL's query.
   * Returns the list, a human label (null = whole collection) and where "back" goes.
   * Labels are functions of the language so they re-render correctly when the language changes.
   */
  function resolveContext(params, quote) {
    const whole = { list: QUOTES, label: null, query: '', back: '#/library', backKey: 'backCollection' };
    let ctx = whole;
    if (params.saved === '1') {
      ctx = { list: bookmarks.list().map(function (id) { return byId.get(id); }), label: t('bm.inLabel'), query: 'saved=1', back: '#/bookmarks', backKey: 'backBookmarks' };
    } else {
      const f = {};
      FILTER_KEYS.forEach(function (k) { if (params[k]) f[k] = params[k]; });
      const query = filterQuery(f);
      if (query) {
        const bits = [];
        if (f.cat) bits.push(catName(f.cat));
        if (f.tag) bits.push('#' + tagName(f.tag));
        if (f.q) bits.push(t('q', f.q));
        if (f.author) bits.push(f.author);
        ctx = { list: filterQuotes(f), label: bits.join(' · '), query: query, back: '#/library?' + query, backKey: 'backResults' };
      }
    }
    // If the quote is not in that list (e.g. bookmark removed, stale link), fall back to the whole collection.
    return ctx.list.indexOf(quote) === -1 ? whole : ctx;
  }

  /* ---------- Quote presentation ---------- */
  function lengthClass(v) {
    const n = v.text.length;
    // A list or multi-paragraph quote reads as long text even when it is short in characters.
    if (/\n/.test(v.text) && n > 80) return 'len-long';
    const base = n <= 48 ? 'len-short' : n <= 125 ? 'len-medium' : 'len-long';
    // Text typed entirely in capitals (Quote 52) is set smaller so it does not shout.
    return v.lang === 'en' && /[A-Z]/.test(v.text) && v.text === v.text.toUpperCase() ? base + ' is-caps' : base;
  }

  /* ---------- Atmosphere: time of day and season, read from the visitor's own clock ---------- */
  function atmosphere() {
    const d = new Date(), hour = d.getHours(), month = d.getMonth();
    const time = hour >= 5 && hour < 11 ? 'morning' : hour < 17 && hour >= 11 ? 'day' : hour >= 17 && hour < 21 ? 'evening' : 'night';
    // Japan's four seasons by month (the Arabic-speaking north shares the same calendar).
    const season = month >= 2 && month <= 4 ? 'spring' : month >= 5 && month <= 7 ? 'summer' : month >= 8 && month <= 10 ? 'autumn' : 'winter';
    document.documentElement.setAttribute('data-time', time);
    document.documentElement.setAttribute('data-season', season);
    return { time: time, season: season };
  }

  const LAST_KEY = 'littlewisdom.last.v1';
  function lastRead() {
    try { const id = localStorage.getItem(LAST_KEY); return id && byId.has(id) ? byId.get(id) : null; } catch (e) { return null; }
  }
  function rememberLast(id) { try { localStorage.setItem(LAST_KEY, id); } catch (e) { /* optional nicety */ } }

  /** Icon-only bookmark toggle used on cards (tooltip + accessible name + aria-pressed). */
  function bookmarkIconButton(q) {
    const saved = bookmarks.has(q.id);
    const btn = h('button', {
      type: 'button', class: 'icon-btn', 'data-bookmark': q.id, 'data-saved': String(saved),
      'aria-pressed': String(saved), 'aria-label': t('bookmarkAria', qv(q).title), title: t(saved ? 'unsave' : 'save'),
      onclick: function () { onBookmark(q.id); }
    });
    btn.innerHTML = ICONS.bookmark;
    return btn;
  }

  /** Labelled bookmark button: the visible text itself says what will happen. */
  function bookmarkTextButton(q, extraClass) {
    const saved = bookmarks.has(q.id);
    return h('button', {
      type: 'button', class: 'btn ' + (extraClass || ''), 'data-bookmark': q.id, 'data-saved': String(saved),
      onclick: function () { onBookmark(q.id); }
    }, icon('bookmark'), h('span', { class: 'btn-label' }, t(saved ? 'unsave' : 'save')));
  }

  /** One card style everywhere: quiet paper, typography first. */
  function quoteCard(q, ctx) {
    const v = qv(q);
    const link = h('a', { class: 'qcard__link', href: quoteHref(q.id, ctx) },
      h('p', { class: 'qcard__no' }, t('quoteNo', q.number)),
      h('p', Object.assign({ class: 'qcard__title' }, langAttrs(v)), v.title),
      h('blockquote', Object.assign({ class: 'q-text', style: 'margin:0' }, langAttrs(v)), v.text),
      h('div', { class: 'qcard__meta' }, q.categories.slice(0, 2).map(function (c) { return h('span', { class: 'chip' }, catName(c)); })),
      h('p', { class: 'qcard__cta' }, t('readQuote'), icon('next')));
    return h('article', { class: 'qcard ' + lengthClass(v) }, link, bookmarkIconButton(q));
  }

  /** A bookmarks entry: a line in a personal notebook. */
  function noteEntry(q, ctx) {
    const v = qv(q);
    return h('li', {}, h('article', { class: 'qcard qcard--note ' + lengthClass(v) },
      h('a', { class: 'qcard__link', href: quoteHref(q.id, ctx) },
        h('p', { class: 'qcard__no' }, t('quoteNo', q.number)),
        h('p', Object.assign({ class: 'qcard__title' }, langAttrs(v)), v.title),
        h('blockquote', Object.assign({ class: 'q-text', style: 'margin:0' }, langAttrs(v)), v.text)),
      bookmarkIconButton(q)));
  }

  function cardGrid(list, ctx) {
    return h('div', { class: 'card-grid' }, list.map(function (q) { return quoteCard(q, ctx); }));
  }

  /* ---------- Search & filter ---------- */
  /**
   * Lower-cases, strips Latin accents, and folds Arabic spelling variants so that
   * أ/إ/آ → ا, ى → ي, ة → ه, and diacritics/tatweel are ignored.
   */
  const normalize = function (s) {
    return s.toLowerCase().normalize('NFD')
      .replace(/[̀-ًͯ-ٰٟـ]/g, '')
      .replace(/[أإآٱ]/g, 'ا')
      .replace(/ى/g, 'ي')
      .replace(/ة/g, 'ه');
  };
  const hasSources = QUOTES.some(function (q) { return q.author; });
  const allTags = Array.from(new Set(QUOTES.flatMap(function (q) { return q.tags; }))).sort();
  const allAuthors = Array.from(new Set(QUOTES.map(function (q) { return q.author; }).filter(Boolean))).sort();
  // One search string per quote covering BOTH languages, built once: a visitor can type
  // English or Arabic in either mode and still find the quote.
  const haystack = new Map(QUOTES.map(function (q) {
    const a = AR[q.id] || {};
    const parts = [q.title, q.text, a.title, a.text, q.author, q.tags.join(' '), q.tags.map(function (g) { return TAGS_AR[g]; }).join(' ')];
    q.categories.forEach(function (c) {
      parts.push(c, CATEGORIES.find(function (k) { return k.id === c; }).name, (CATEGORIES_AR[c] || {}).name);
    });
    return [q.id, normalize(parts.filter(Boolean).join(' '))];
  }));

  function filterQuotes(f) {
    const terms = normalize(f.q || '').split(/\s+/).filter(Boolean);
    return QUOTES.filter(function (q) {
      if (f.cat && q.categories.indexOf(f.cat) === -1) return false;
      if (f.tag && q.tags.indexOf(f.tag) === -1) return false;
      if (f.author && q.author !== f.author) return false;
      return terms.every(function (term) { return haystack.get(q.id).indexOf(term) !== -1; });
    });
  }

  /* ---------- Shared pieces ---------- */
  function emptyState(title, message, actions, scene) {
    return h('div', { class: 'empty' },
      h('div', { class: 'empty__art' }, window.sceneElement(scene || 'rain', { decorative: true })),
      h('h2', {}, title), h('p', {}, message), actions);
  }

  function goRandom() {
    const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    location.hash = quoteHref(q.id);
  }

  /** One quote per calendar day (local time), chosen from the short, hero-worthy ones. */
  function quoteOfTheDay() {
    const pool = QUOTES.filter(function (q) { return q.text.length <= 160; });
    const d = new Date();
    const dayNumber = Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
    return pool[dayNumber % pool.length].id;
  }

  /* ---------- Views ---------- */
  let featuredId = quoteOfTheDay();
  let featuredIsDaily = true;

  function homeView() {
    const atm = atmosphere();
    const featuredHost = h('section', { class: 'section featured-sec', 'aria-labelledby': 'featured-h' });
    function paintFeatured() {
      const q = byId.get(featuredId);
      const v = qv(q);
      featuredHost.replaceChildren(
        h('div', { class: 'wrap featured ' + lengthClass(v) },
          h('p', { class: 'label', id: 'featured-h' }, t(featuredIsDaily ? 'featured.daily' : 'featured.plain') + ' · ' + t('quoteNo', q.number)),
          h('blockquote', { style: 'margin:0' }, h('p', Object.assign({ class: 'q-text' }, langAttrs(v)), v.text)),
          h('p', Object.assign({ class: 'featured-title' }, langAttrs(v)), v.title),
          h('div', { class: 'featured-actions' },
            h('a', { class: 'btn', href: quoteHref(q.id) }, t('readQuote'), icon('next')),
            bookmarkTextButton(q, 'btn--ghost'),
            h('button', {
              class: 'btn btn--ghost', type: 'button',
              onclick: function () {
                const others = QUOTES.filter(function (x) { return x.id !== featuredId && x.text.length < 160; });
                featuredId = others[Math.floor(Math.random() * others.length)].id;
                featuredIsDaily = false;
                paintFeatured();
              }
            }, icon('shuffle'), t('showAnother'))
          )
        )
      );
    }
    paintFeatured();

    const selected = ['q07', 'q08', 'q14', 'q17', 'q21', 'q28'].map(function (id) { return byId.get(id); }).filter(Boolean);
    const byLength = QUOTES.slice().sort(function (a, b) { return qv(a).text.length - qv(b).text.length; });
    const shortest = byLength.slice(0, 5);
    const longest = byLength.slice(-5).reverse();
    const beginning = QUOTES.slice(0, 5);

    const list = function (items) {
      return h('ul', {}, items.map(function (q) {
        const v = qv(q);
        return h('li', {}, h('a', { href: quoteHref(q.id) },
          h('span', Object.assign({ class: 'd-title' }, langAttrs(v)), pad(q.number) + ' · ' + v.title),
          h('span', Object.assign({ class: 'd-excerpt' }, langAttrs(v)), v.text.replace(/\n+/g, ' '))));
      }));
    };

    const last = lastRead();
    const lv = last ? qv(last) : null;

    return h('div', {},
      h('section', { class: 'hero' },
        h('div', { class: 'wrap hero-text' },
          h('p', { class: 'greeting' }, t('greet.' + atm.time) + ' · ' + t('season.' + atm.season)),
          h('h1', {}, t('hero.title1'), h('em', {}, t('hero.title2'))),
          h('p', { class: 'hero-lede' }, t('hero.lede')),
          h('div', { class: 'hero-actions' },
            h('a', { class: 'btn', href: quoteHref(QUOTES[0].id) }, t('startWith', 1), icon('next')),
            h('a', { class: 'btn btn--ghost', href: '#/library' }, t('browseAll', QUOTES.length))),
          last ? h('p', { class: 'resume' }, h('a', { href: quoteHref(last.id) }, t('resume', last.number),
            h('span', Object.assign({ class: 'resume__title' }, langAttrs(lv)), ' — ' + lv.title))) : null
        ),
        h('div', { class: 'wrap hero-scene' },
          h('div', { class: 'scene-frame' }, window.sceneElement('home', { live: true }), h('span', { class: 'daylight', 'aria-hidden': 'true' })))
      ),
      featuredHost,
      h('section', { class: 'section', 'aria-labelledby': 'cats-h' },
        h('div', { class: 'wrap' },
          h('div', { class: 'section-head' },
            h('h2', { id: 'cats-h' }, t('cats.title')),
            h('p', {}, t('cats.sub'))),
          h('div', { class: 'shelf' }, CATEGORIES.map(function (c, i) {
            const count = QUOTES.filter(function (q) { return q.categories.indexOf(c.id) !== -1; }).length;
            return h('a', { class: 'book book--' + ((i % 7) + 1), href: '#/library?cat=' + c.id },
              h('span', { class: 'num' }, t('categoryCount', i + 1, count)),
              h('h3', {}, catName(c.id)), h('p', {}, catBlurb(c.id)));
          }).concat([
            h('button', { class: 'book book--random', type: 'button', onclick: goRandom },
              icon('shuffle'), h('span', { class: 'book__label' }, t('keep.random')))
          ])))
      ),
      h('section', { class: 'section', 'aria-labelledby': 'sel-h' },
        h('div', { class: 'wrap' },
          h('div', { class: 'section-head' },
            h('h2', { id: 'sel-h' }, t('selected.title')),
            h('a', { class: 'btn btn--ghost btn--small', href: '#/library' }, t('browseAll', QUOTES.length), icon('next'))),
          cardGrid(selected))
      ),
      h('section', { class: 'section section--last', 'aria-labelledby': 'disc-h' },
        h('div', { class: 'wrap' },
          h('div', { class: 'section-head' },
            h('h2', { id: 'disc-h' }, t('keep.title'))),
          h('div', { class: 'discover' },
            h('div', {}, h('h3', {}, t('keep.begin')), list(beginning)),
            h('div', {}, h('h3', {}, t('keep.short')), list(shortest)),
            h('div', {}, h('h3', {}, t('keep.long')), list(longest))))
      )
    );
  }

  const libraryState = { q: '', cat: '', tag: '', author: '' };

  function libraryView(params) {
    // Filters come from the URL, so refresh, Back and shared links all restore them.
    libraryState.cat = CATEGORIES.some(function (c) { return c.id === params.cat; }) ? params.cat : '';
    libraryState.tag = allTags.indexOf(params.tag) !== -1 ? params.tag : '';
    libraryState.author = allAuthors.indexOf(params.author) !== -1 ? params.author : '';
    libraryState.q = params.q || '';

    const results = h('div', { id: 'results' });
    const count = h('p', { class: 'result-count', 'aria-live': 'polite' });
    const input = h('input', {
      id: 'search', type: 'search', placeholder: t('lib.placeholder'), autocomplete: 'off',
      oninput: function () { libraryState.q = input.value; paint(); }
    });
    input.value = libraryState.q;

    const chips = h('div', { class: 'filter-row filter-row--themes', role: 'group', 'aria-label': t('lib.filterAria') });
    const tagSelect = h('select', { id: 'tag', onchange: function () { libraryState.tag = tagSelect.value; paint(); } },
      h('option', { value: '' }, t('lib.allTags')),
      sortedTags().map(function (g) { return h('option', { value: g }, tagName(g)); }));
    tagSelect.value = libraryState.tag;
    const authorSelect = hasSources ? h('select', { id: 'author', onchange: function () { libraryState.author = authorSelect.value; paint(); } },
      h('option', { value: '' }, t('lib.allSources')),
      allAuthors.map(function (a) { return h('option', { value: a }, a); })) : null;
    if (authorSelect) authorSelect.value = libraryState.author;

    const clear = h('button', { type: 'button', class: 'btn btn--ghost btn--small', onclick: function () {
      libraryState.q = libraryState.cat = libraryState.tag = libraryState.author = '';
      input.value = ''; tagSelect.value = ''; if (authorSelect) authorSelect.value = '';
      paint(); input.focus();
    } }, t('lib.clear'));

    function paintChips() {
      chips.replaceChildren.apply(chips, [{ id: '', name: t('lib.allThemes') }].concat(CATEGORIES.map(function (c) {
        return { id: c.id, name: catName(c.id) };
      })).map(function (c) {
        return h('button', {
          type: 'button', class: 'pill', 'aria-pressed': String(libraryState.cat === c.id),
          onclick: function () { libraryState.cat = c.id; paint(); }
        }, c.name);
      }));
    }

    function paint() {
      paintChips();
      const list = filterQuotes(libraryState);
      const query = filterQuery(libraryState);
      clear.hidden = !query;
      // Keep the URL in sync without adding history entries or re-rendering.
      try { history.replaceState(null, '', '#/library' + (query ? '?' + query : '')); } catch (e) { /* e.g. sandboxed frame */ }
      count.textContent = !query ? t('lib.showingAll', QUOTES.length) : t('lib.found', list.length);
      results.replaceChildren(list.length ? cardGrid(list, query) : emptyState(
        t('lib.emptyTitle'), t('lib.emptyText'),
        h('button', { class: 'btn', type: 'button', onclick: function () { clear.click(); } }, t('lib.clear'))));
      // On phones the theme pills scroll sideways; keep the chosen one in view.
      const on = chips.querySelector('[aria-pressed="true"]');
      if (on && chips.scrollWidth > chips.clientWidth) {
        const box = chips.getBoundingClientRect(), pill = on.getBoundingClientRect();
        // scrollLeft deltas are physical, so this works in both left-to-right and right-to-left.
        if (pill.left < box.left) chips.scrollLeft += pill.left - box.left - 16;
        else if (pill.right > box.right) chips.scrollLeft += pill.right - box.right + 16;
      }
    }

    const view = h('div', { class: 'wrap' },
      h('div', { class: 'page-head' },
        h('h1', {}, t('lib.title')),
        h('p', {}, t('lib.intro'))),
      h('div', { class: 'filters' },
        h('div', { class: 'search-field' },
          h('label', { class: 'visually-hidden', for: 'search' }, t('lib.searchLabel')), icon('search'), input),
        chips,
        h('div', { class: 'filter-row' },
          h('label', { class: 'select-wrap', for: 'tag' }, t('lib.tag'), tagSelect),
          authorSelect ? h('label', { class: 'select-wrap', for: 'author' }, t('lib.source'), authorSelect) : null,
          clear, count)),
      results);
    paint();
    if (params.focus === '1') setTimeout(function () { input.focus(); }, 0);
    return view;
  }

  function related(q) {
    return QUOTES.filter(function (x) { return x.id !== q.id; }).map(function (x) {
      const score = x.categories.filter(function (c) { return q.categories.indexOf(c) !== -1; }).length * 2 +
        x.tags.filter(function (g) { return q.tags.indexOf(g) !== -1; }).length * 3;
      return { quote: x, score: score };
    }).filter(function (r) { return r.score > 0; })
      .sort(function (a, b) { return b.score - a.score || a.quote.number - b.quote.number; })
      .slice(0, 3).map(function (r) { return r.quote; });
  }

  // Targets for the arrow-key shortcuts on the quote page.
  let activeStep = { prev: null, next: null };

  function stepControl(kind, target, ctx, variant) {
    const isNext = kind === 'next';
    const text = t(isNext ? 'next' : 'prev');
    const tv = target ? qv(target) : null;
    const content = variant === 'large'
      ? [h('span', { class: 'step-dir' }, isNext ? null : icon('prev'), text, isNext ? icon('next') : null),
         target ? h('span', Object.assign({ class: 'step-title' }, langAttrs(tv)), pad(target.number) + ' · ' + tv.title) : null]
      : [isNext ? null : icon('prev'), text, isNext ? icon('next') : null];
    const cls = (variant === 'large' ? 'step step--' : 'btn btn--small step-btn step-btn--') + kind;
    if (!target) {
      return h('span', { class: cls + ' is-disabled', 'aria-disabled': 'true' }, content);
    }
    return h('a', { class: cls, href: quoteHref(target.id, ctx.query), rel: kind === 'next' ? 'next' : 'prev' }, content);
  }

  function quoteView(id, params) {
    const q = byId.get(id);
    if (!q) return notFoundView();
    const v = qv(q);
    const ctx = resolveContext(params, q);
    const i = ctx.list.indexOf(q);
    const prev = ctx.list[i - 1] || null, next = ctx.list[i + 1] || null;
    activeStep = { prev: prev && quoteHref(prev.id, ctx.query), next: next && quoteHref(next.id, ctx.query) };
    const rel = related(q);
    const filtered = ctx.label !== null;
    const position = filtered ? t('positionIn', i + 1, ctx.list.length, ctx.label) : t('positionWhole', q.number, QUOTES.length);
    // Built fresh per use: one DOM node cannot live in two places (the bar at the top and the one below).
    const instead = function () { return filtered ? [' · ', h('a', { href: quoteHref(q.id) }, t('browseInstead', QUOTES.length))] : null; };

    const endNote = !next
      ? h('p', { class: 'end-note' }, filtered ? t('end.lastIn', ctx.label) : t('end.last'),
          h('a', { href: filtered ? ctx.back : quoteHref(QUOTES[0].id) }, filtered ? t(ctx.backKey) : t('end.restart')))
      : !prev
        ? h('p', { class: 'end-note' }, filtered ? t('end.firstIn', ctx.label) : t('end.first'))
        : null;

    // In Arabic mode the original English stays visible beneath the translation (trust + context).
    const original = v.lang === 'ar'
      ? h('aside', { class: 'original' },
          h('p', { class: 'label' }, t('original')),
          h('p', { class: 'original__text', lang: 'en', dir: 'ltr' }, q.text))
      : null;

    return h('div', { class: 'wrap reader' },
      h('nav', { class: 'quote-bar', 'aria-label': t('quoteNav') },
        h('a', { class: 'back-link', href: ctx.back }, icon('prev'), t(ctx.backKey)),
        h('div', { class: 'quote-bar__steps' }, stepControl('prev', prev, ctx, 'compact'), stepControl('next', next, ctx, 'compact'))),
      h('p', { class: 'position position--top' }, position, instead()),
      h('figure', { class: 'reader-art' }, window.sceneElement(q.image, { decorative: false, live: true })),
      h('div', { class: 'reader-grid' },
        h('article', { class: lengthClass(v) },
          h('p', { class: 'label' }, t('quoteNo', q.number) + ' · ' + q.categories.map(catName).join(' · ')),
          h('h1', Object.assign({ class: 'reader-title', tabindex: '-1' }, langAttrs(v)), v.title),
          h('blockquote', {}, h('p', Object.assign({ class: 'q-text' }, langAttrs(v)), v.text)),
          original,
          (q.author || safeUrl(q.sourceUrl)) ? h('p', { class: 'reader-source' }, t('source') + ' ',
            safeUrl(q.sourceUrl) ? h('a', { href: safeUrl(q.sourceUrl), rel: 'noopener noreferrer' }, q.author || safeUrl(q.sourceUrl)) : q.author) : null,
          h('div', { class: 'reader-tags' }, q.tags.map(function (g) {
            return h('a', { class: 'chip', href: '#/library?tag=' + encodeURIComponent(g), 'aria-label': t('tagAria', tagName(g)) }, '#' + tagName(g));
          })),
          h('div', { class: 'reader-actions' },
            bookmarkTextButton(q),
            h('button', { class: 'btn btn--ghost', type: 'button', onclick: function () { onCopy(q.id); } }, icon('copy'), t('copy')),
            h('button', { class: 'btn btn--ghost', type: 'button', onclick: function () { onShare(q.id); } }, icon('share'), t('share')))
        )
      ),
      h('section', { class: 'continue', 'aria-labelledby': 'cont-h' },
        h('h2', { id: 'cont-h' }, t('continue')),
        h('p', { class: 'position' }, position, instead()),
        h('div', { class: 'continue__steps' }, stepControl('prev', prev, ctx, 'large'), stepControl('next', next, ctx, 'large')),
        endNote,
        h('p', { class: 'hint' }, t('hint'))),
      rel.length ? h('section', { class: 'related', 'aria-labelledby': 'rel-h' }, h('h2', { id: 'rel-h' }, t('related')), cardGrid(rel)) : null
    );
  }

  function bookmarksView() {
    const saved = bookmarks.list().map(function (id) { return byId.get(id); });
    return h('div', { class: 'wrap bookmarks-page' },
      h('div', { class: 'page-head' },
        h('h1', {}, t('bm.title')),
        h('p', {}, t('bm.intro'))),
      saved.length ? h('div', { class: 'notebook' }, h('ol', { class: 'notebook__list' }, saved.map(function (q) { return noteEntry(q, 'saved=1'); }))) : emptyState(
        t('bm.emptyTitle'), t('bm.emptyText'),
        h('a', { class: 'btn', href: '#/library' }, t('browseAll', QUOTES.length)), 'desk')
    );
  }

  function notFoundView() {
    activeStep = { prev: null, next: null };
    return h('div', { class: 'wrap' }, emptyState(t('nf.title'), t('nf.text'),
      h('a', { class: 'btn', href: '#/library' }, t('browseAll', QUOTES.length)), 'night'));
  }

  /* ---------- Router ---------- */
  let currentRoute = { name: 'home' };

  function parseHash() {
    const raw = location.hash.replace(/^#\/?/, '');
    const parts = raw.split('?');
    const segs = parts[0].split('/').filter(Boolean);
    const params = {};
    new URLSearchParams(parts[1] || '').forEach(function (v, k) { params[k] = v; });
    if (!segs.length) return { name: 'home', params: params };
    if (segs[0] === 'library') return { name: 'library', params: params };
    if (segs[0] === 'bookmarks') return { name: 'bookmarks', params: params };
    if (segs[0] === 'quote' && segs[1]) {
      let id = segs[1];
      try { id = decodeURIComponent(id); } catch (e) { /* keep raw */ }
      return { name: 'quote', id: id, params: params };
    }
    return { name: 'notfound', params: params };
  }

  function renderRoute(keepScroll) {
    currentRoute = parseHash();
    activeStep = { prev: null, next: null };
    let view, title = t('title.home');
    switch (currentRoute.name) {
      case 'home': view = homeView(); break;
      case 'library': view = libraryView(currentRoute.params); title = t('title.lib'); break;
      case 'bookmarks': view = bookmarksView(); title = t('title.bm'); break;
      case 'quote': {
        view = quoteView(currentRoute.id, currentRoute.params);
        const q = byId.get(currentRoute.id);
        title = q ? qv(q).title + ' · Little Wisdom' : t('title.nf');
        break;
      }
      default: view = notFoundView(); title = t('title.nf');
    }
    atmosphere();
    if (currentRoute.name === 'quote' && byId.has(currentRoute.id)) rememberLast(currentRoute.id);
    app.replaceChildren(view);
    if (!keepScroll) { app.classList.remove('view-in'); void app.offsetWidth; app.classList.add('view-in'); }
    document.title = title;
    document.querySelectorAll('[data-nav]').forEach(function (a) {
      if (a.getAttribute('data-nav') === currentRoute.name) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    if (!keepScroll) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });   // never animate the jump: the next quote should simply be there
      // Move focus to the new page's heading so keyboard and screen-reader users start at the top.
      const heading = currentRoute.name === 'quote' ? app.querySelector('h1[tabindex="-1"]') : null;
      (heading || main).focus({ preventScroll: true });
    }
  }

  /* ---------- Language switch ---------- */
  function syncLangButtons() {
    document.querySelectorAll('.lang-btn').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === I18N.lang));
    });
  }

  function applyLanguageToChrome() {
    I18N.applyStatic(document);
    syncLangButtons();
    updateBookmarkCount();
  }

  function setLanguage(lang) {
    if (lang === I18N.lang) return;
    I18N.setLang(lang);
    applyLanguageToChrome();
    renderRoute(true);        // re-render in place: same page, same scroll position, same filters
    toast(t('toast.lang'));
  }

  document.querySelectorAll('.lang-btn').forEach(function (b) {
    b.addEventListener('click', function () { setLanguage(b.getAttribute('data-lang')); });
  });

  window.addEventListener('hashchange', function () { renderRoute(false); });

  // Arrow keys step through quotes, following the on-screen direction (in Arabic, → is "previous").
  // Ignored while typing or with a modifier key held.
  document.addEventListener('keydown', function (e) {
    if (currentRoute.name !== 'quote' || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    const el = e.target;
    if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
    const forwardKey = isAr() ? 'ArrowLeft' : 'ArrowRight';
    const href = e.key === forwardKey ? activeStep.next : activeStep.prev;
    if (href) { e.preventDefault(); location.hash = href; }
  });

  // Keep bookmarks in sync if another tab changes them.
  window.addEventListener('storage', function (e) {
    if (e.key !== STORE_KEY) return;
    bookmarks.reload();
    updateBookmarkCount();
    if (currentRoute.name === 'bookmarks') renderRoute(true);
  });

  applyLanguageToChrome();
  renderRoute(true);
})();
