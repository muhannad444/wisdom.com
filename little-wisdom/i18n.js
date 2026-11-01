/*
 * Little Wisdom — interface language layer (English / العربية).
 * Loaded in <head> so <html lang dir> is correct before the first paint.
 * Quote content is separate: English in quotes.js, Arabic in quotes-ar.js.
 *
 * Usage: I18N.t('key', arg1, arg2)  ·  I18N.lang  ·  I18N.setLang('ar')  ·  I18N.applyStatic()
 */
(function (root) {
  'use strict';

  const STORE_KEY = 'littlewisdom.lang.v1';
  const DIRS = { en: 'ltr', ar: 'rtl' };
  const pad = function (n) { return String(n).padStart(2, '0'); };

  /** Saved choice first; otherwise follow the browser (Arabic browsers get Arabic), else English. */
  function detect() {
    try {
      const saved = localStorage.getItem(STORE_KEY);
      if (saved === 'en' || saved === 'ar') return saved;
    } catch (e) { /* storage blocked: fall through */ }
    const nav = (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
    return /^ar(\b|-)/i.test(nav) ? 'ar' : 'en';
  }

  /** Arabic has singular, dual, 3–10, and 11+ forms. */
  function arCount(n, one, two, few, many) {
    if (n === 1) return one;
    if (n === 2) return two;
    return n + ' ' + (n >= 3 && n <= 10 ? few : many);
  }
  const arQuotes = function (n) { return arCount(n, 'اقتباس واحد', 'اقتباسان', 'اقتباسات', 'اقتباسًا'); };
  const enQuotes = function (n) { return n + (n === 1 ? ' quote' : ' quotes'); };

  const STRINGS = {
    en: {
      'skip': 'Skip to content',
      'home.aria': 'Little Wisdom, home',
      'nav.primary': 'Primary',
      'nav.search': 'Search',
      'nav.searchMore': ' quotes',
      'nav.bookmarks': 'Bookmarks',
      'lang.label': 'Language',
      'footer.nav': 'Footer',
      'footer.closing': 'Make wisdom easy to discover, beautiful to read, and simple to keep.',
      'footer.home': 'Home',
      'footer.all': 'All quotes',
      'footer.bookmarks': 'Your bookmarks',
      'footer.small': 'Little Wisdom · Illustrations are original drawings made for this site. Bookmarks are stored in this browser only.',
      'bookmarkCount': function (n) { return n + (n === 1 ? ' saved quote' : ' saved quotes'); },
      'loadError': 'Sorry, the quotes could not be loaded. Please refresh the page.',

      'greet.morning': 'Good morning', 'greet.day': 'Good afternoon', 'greet.evening': 'Good evening', 'greet.night': 'A quiet night',
      'season.spring': 'spring', 'season.summer': 'summer', 'season.autumn': 'autumn', 'season.winter': 'winter',
      'resume': function (n) { return 'Continue where you left off · ' + 'No. ' + pad(n); },
      'loading': 'Opening…',
      'hero.hand': 'a small illustrated magazine',
      'hero.title1': 'Little ',
      'hero.title2': 'Wisdom',
      'hero.bubble': 'read slowly…',
      'hero.lede': 'Meaningful ideas for a life of curiosity, clarity, and purpose.',
      'hero.collageAria': 'Illustrations: rain at a window, a sunset train ride, a quiet desk',
      'startWith': function (n) { return 'Start with quote ' + pad(n); },
      'browseAll': function (n) { return 'Browse all ' + enQuotes(n); },
      'featured.daily': 'Quote of the day',
      'featured.plain': 'Featured quote',
      'quoteNo': function (n) { return 'No. ' + pad(n); },
      'readQuote': 'Read quote',
      'showAnother': 'Show another',
      'cats.title': 'Browse by theme',
      'cats.sub': 'Seven themes. Pick one to see its quotes.',
      'categoryCount': function (i, n) { return pad(i) + ' · ' + enQuotes(n); },
      'selected.title': 'Selected quotes',
      'keep.title': 'Keep reading',
      'keep.random': 'Open a random quote',
      'keep.begin': 'Start at the beginning',
      'keep.short': 'Quick reads',
      'keep.long': 'Longer reflections',

      'lib.title': 'All quotes',
      'lib.intro': 'Search by title, text, or topic, or filter by theme. Open any quote to keep reading from there.',
      'lib.searchLabel': 'Search quotes',
      'lib.placeholder': 'Search by title, text, or topic',
      'lib.filterAria': 'Filter by theme',
      'lib.allThemes': 'All themes',
      'lib.tag': 'Tag',
      'lib.allTags': 'All tags',
      'lib.source': 'Source',
      'lib.allSources': 'All sources',
      'lib.clear': 'Clear filters',
      'lib.showingAll': function (n) { return 'Showing all ' + enQuotes(n); },
      'lib.found': function (n) { return n + (n === 1 ? ' quote found' : ' quotes found'); },
      'lib.emptyTitle': 'No quotes found',
      'lib.emptyText': 'Try another word, or choose a different theme.',

      'bm.title': 'Your bookmarks',
      'bm.inLabel': 'your bookmarks',
      'bm.intro': 'Quotes you saved on this device. They stay in this browser and do not sync to other browsers or devices.',
      'bm.emptyTitle': 'You haven’t saved any quotes yet',
      'bm.emptyText': 'Choose “Save quote” on any quote and it will wait for you here.',
      'nf.title': 'We couldn’t find that page',
      'nf.text': 'The quote or page you asked for does not exist.',

      'save': 'Save quote',
      'unsave': 'Remove bookmark',
      'bookmarkAria': function (title) { return 'Bookmark: ' + title; },
      'copy': 'Copy quote',
      'share': 'Share quote',
      'prev': 'Previous quote',
      'next': 'Next quote',
      'quoteNav': 'Quote navigation',
      'backCollection': 'Back to collection',
      'backResults': 'Back to results',
      'backBookmarks': 'Back to bookmarks',
      'continue': 'Continue reading',
      'related': 'You might also like',
      'source': 'Source:',
      'original': 'Original English',
      'tagAria': function (tag) { return 'Show quotes tagged ' + tag; },
      'hint': 'Tip: press the ← and → keys to move between quotes.',
      'positionWhole': function (i, n) { return 'Quote ' + i + ' of ' + n; },
      'positionIn': function (i, n, label) { return i + ' of ' + n + ' in ' + label; },
      'browseInstead': function (n) { return 'Browse all ' + n + ' instead'; },
      'end.lastIn': function (label) { return 'That was the last quote in ' + label + '. '; },
      'end.last': 'You have reached the last quote. ',
      'end.restart': 'Start again from quote 01',
      'end.firstIn': function (label) { return 'This is the first quote in ' + label + '.'; },
      'end.first': 'This is the first quote.',
      'q': function (s) { return '“' + s + '”'; },

      'toast.saved': 'Saved to bookmarks.',
      'toast.removed': 'Removed from bookmarks.',
      'toast.noStorage': 'Saved for this visit only. Your browser blocked storage.',
      'toast.copied': 'Quote copied.',
      'toast.copyFail': 'Could not copy. Select the text and copy it manually.',
      'toast.linkCopied': 'Quote and link copied.',
      'toast.lang': 'Switched to English.',
      'title.home': 'Little Wisdom',
      'title.lib': 'All quotes · Little Wisdom',
      'title.bm': 'Your bookmarks · Little Wisdom',
      'title.nf': 'Not found · Little Wisdom'
    },

    ar: {
      'skip': 'تخطَّ إلى المحتوى',
      'home.aria': 'Little Wisdom، الصفحة الرئيسية',
      'nav.primary': 'التنقل الرئيسي',
      'nav.search': 'ابحث',
      'nav.searchMore': ' في الاقتباسات',
      'nav.bookmarks': 'المحفوظات',
      'lang.label': 'اللغة',
      'footer.nav': 'روابط أسفل الصفحة',
      'footer.closing': 'خلّ الحكمة سهلة الاكتشاف، جميلة القراءة، وبسيطة الحفظ.',
      'footer.home': 'الرئيسية',
      'footer.all': 'كل الاقتباسات',
      'footer.bookmarks': 'محفوظاتك',
      'footer.small': 'Little Wisdom · الرسومات أصلية، مرسومة لهذا الموقع خصيصًا. المحفوظات تبقى في هذا المتصفح فقط.',
      'bookmarkCount': function (n) { return 'عدد المحفوظات: ' + n; },
      'loadError': 'للأسف ما قدرنا نحمّل الاقتباسات. حدّث الصفحة وجرّب مرة ثانية.',

      'greet.morning': 'صباح الخير', 'greet.day': 'نهارك سعيد', 'greet.evening': 'مساء الخير', 'greet.night': 'ليلة هادئة',
      'season.spring': 'الربيع', 'season.summer': 'الصيف', 'season.autumn': 'الخريف', 'season.winter': 'الشتاء',
      'resume': function (n) { return 'كمّل من حيث وقفت · رقم ' + pad(n); },
      'loading': 'لحظة…',
      'hero.hand': 'مجلة صغيرة مصوّرة',
      'hero.title1': 'حكمة ',
      'hero.title2': 'صغيرة',
      'hero.bubble': 'اقرأ على مهلك…',
      'hero.lede': 'أفكار ذات معنى لحياة فيها فضول ووضوح وهدف.',
      'hero.collageAria': 'رسومات: مطر على نافذة، وغروب من قطار، ومكتب هادئ',
      'startWith': function (n) { return 'ابدأ من الاقتباس ' + pad(n); },
      'browseAll': function () { return 'تصفّح كل الاقتباسات'; },
      'featured.daily': 'اقتباس اليوم',
      'featured.plain': 'اقتباس مميّز',
      'quoteNo': function (n) { return 'رقم ' + pad(n); },
      'readQuote': 'اقرأ الاقتباس',
      'showAnother': 'اعرض اقتباس ثاني',
      'cats.title': 'تصفّح حسب الموضوع',
      'cats.sub': 'سبعة مواضيع. اختر واحد وشوف اقتباساته.',
      'categoryCount': function (i, n) { return pad(i) + ' · ' + arQuotes(n); },
      'selected.title': 'اقتباسات مختارة',
      'keep.title': 'كمّل القراءة',
      'keep.random': 'افتح اقتباس عشوائي',
      'keep.begin': 'ابدأ من البداية',
      'keep.short': 'قراءات سريعة',
      'keep.long': 'تأملات أطول',

      'lib.title': 'كل الاقتباسات',
      'lib.intro': 'ابحث بالعنوان أو النص أو الموضوع، أو صفّي حسب الموضوع. افتح أي اقتباس وكمّل القراءة من عنده.',
      'lib.searchLabel': 'ابحث في الاقتباسات',
      'lib.placeholder': 'ابحث بالعنوان أو النص أو الموضوع',
      'lib.filterAria': 'تصفية حسب الموضوع',
      'lib.allThemes': 'كل المواضيع',
      'lib.tag': 'الوسم',
      'lib.allTags': 'كل الوسوم',
      'lib.source': 'المصدر',
      'lib.allSources': 'كل المصادر',
      'lib.clear': 'إلغاء التصفية',
      'lib.showingAll': function (n) { return 'عرض كل الاقتباسات (' + n + ')'; },
      'lib.found': function (n) { return n === 1 ? 'لقينا اقتباس واحد' : n === 2 ? 'لقينا اقتباسين' : 'لقينا ' + (n >= 3 && n <= 10 ? n + ' اقتباسات' : n + ' اقتباسًا'); },
      'lib.emptyTitle': 'ما لقينا أي اقتباس',
      'lib.emptyText': 'جرّب كلمة ثانية، أو اختر موضوع مختلف.',

      'bm.title': 'محفوظاتك',
      'bm.inLabel': 'محفوظاتك',
      'bm.intro': 'الاقتباسات اللي حفظتها على هذا الجهاز. تبقى في هذا المتصفح فقط، وما تنتقل لمتصفحات أو أجهزة ثانية.',
      'bm.emptyTitle': 'ما حفظت أي اقتباس للحين',
      'bm.emptyText': 'اضغط «احفظ الاقتباس» على أي اقتباس وبيكون هنا ينتظرك.',
      'nf.title': 'ما لقينا هالصفحة',
      'nf.text': 'الاقتباس أو الصفحة اللي طلبتها مو موجودة.',

      'save': 'احفظ الاقتباس',
      'unsave': 'احذف من المحفوظات',
      'bookmarkAria': function (title) { return 'احفظ: ' + title; },
      'copy': 'انسخ الاقتباس',
      'share': 'شارك الاقتباس',
      'prev': 'الاقتباس السابق',
      'next': 'الاقتباس التالي',
      'quoteNav': 'التنقل بين الاقتباسات',
      'backCollection': 'الرجوع للمجموعة',
      'backResults': 'الرجوع للنتائج',
      'backBookmarks': 'الرجوع للمحفوظات',
      'continue': 'كمّل القراءة',
      'related': 'ممكن يعجبك بعد',
      'source': 'المصدر:',
      'original': 'النص الأصلي بالإنجليزي',
      'tagAria': function (tag) { return 'اعرض الاقتباسات بوسم ' + tag; },
      'hint': 'نصيحة: استخدم مفتاحي السهم يمين ويسار للتنقل بين الاقتباسات.',
      'positionWhole': function (i, n) { return 'اقتباس ' + i + ' من ' + n; },
      'positionIn': function (i, n, label) { return i + ' من ' + n + ' في ' + label; },
      'browseInstead': function () { return 'تصفّح كل الاقتباسات بدل كذا'; },
      'end.lastIn': function (label) { return 'هذا آخر اقتباس في ' + label + '. '; },
      'end.last': 'وصلت لآخر اقتباس. ',
      'end.restart': 'ابدأ من جديد من الاقتباس 01',
      'end.firstIn': function (label) { return 'هذا أول اقتباس في ' + label + '.'; },
      'end.first': 'هذا أول اقتباس.',
      'q': function (s) { return '«' + s + '»'; },

      'toast.saved': 'انحفظ في المحفوظات.',
      'toast.removed': 'انحذف من المحفوظات.',
      'toast.noStorage': 'انحفظ لهالزيارة بس. المتصفح منع التخزين.',
      'toast.copied': 'تم نسخ الاقتباس.',
      'toast.copyFail': 'ما قدرنا ننسخ. حدّد النص وانسخه يدويًا.',
      'toast.linkCopied': 'تم نسخ الاقتباس والرابط.',
      'toast.lang': 'تم التبديل إلى العربية.',
      'title.home': 'حكمة صغيرة · Little Wisdom',
      'title.lib': 'كل الاقتباسات · Little Wisdom',
      'title.bm': 'محفوظاتك · Little Wisdom',
      'title.nf': 'غير موجود · Little Wisdom'
    }
  };

  const I18N = {
    lang: detect(),
    dir: function () { return DIRS[this.lang]; },
    t: function (key) {
      const table = STRINGS[I18N.lang] || STRINGS.en;
      let value = table[key];
      if (value === undefined) value = STRINGS.en[key];
      if (value === undefined) return key; // visible during development, never crashes
      return typeof value === 'function' ? value.apply(null, Array.prototype.slice.call(arguments, 1)) : value;
    },
    /** Reflect the current language on <html> so CSS (:lang, [dir]) and assistive tech follow. */
    syncDocument: function () {
      document.documentElement.lang = I18N.lang;
      document.documentElement.dir = DIRS[I18N.lang];
    },
    setLang: function (lang) {
      if (!DIRS[lang]) return;
      I18N.lang = lang;
      try { localStorage.setItem(STORE_KEY, lang); } catch (e) { /* the choice still applies for this visit */ }
      I18N.syncDocument();
    },
    /** Fill static markup: data-i18n="key" sets text; data-i18n-attr="aria-label:key;title:key". */
    applyStatic: function (scope) {
      const root = scope || document;
      root.querySelectorAll('[data-i18n]').forEach(function (el) { el.textContent = I18N.t(el.getAttribute('data-i18n')); });
      root.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
        el.getAttribute('data-i18n-attr').split(';').forEach(function (pair) {
          const i = pair.indexOf(':');
          if (i > 0) el.setAttribute(pair.slice(0, i).trim(), I18N.t(pair.slice(i + 1).trim()));
        });
      });
    }
  };

  I18N.syncDocument();
  root.I18N = I18N;
})(window);
