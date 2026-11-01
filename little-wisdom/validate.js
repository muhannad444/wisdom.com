// Data-integrity checks. Run with:  node validate.js
// English: count, ids, order, and a PINNED fingerprint, so any accidental edit to a title or
// quote text fails here. Arabic: every quote translated, line structure and punctuation match.
// This cannot judge translation QUALITY: a native Saudi reader still needs to review it.
const fs = require('fs');
const vm = require('vm');
const crypto = require('crypto');

// Fingerprint of [number, title, text] for all 55 supplied English quotes.
// Update it ONLY when you deliberately change the English content.
const EXPECTED_ENGLISH_FINGERPRINT = '44aeca86db658444';

const sandbox = {};
sandbox.globalThis = sandbox;
for (const file of ['quotes.js', 'quotes-ar.js']) {
  vm.runInNewContext(fs.readFileSync(__dirname + '/' + file, 'utf8'), sandbox);
}
const { QUOTES, CATEGORIES, QUOTES_AR, CATEGORIES_AR, TAGS_AR } = sandbox;

let failures = 0;
const check = (ok, msg) => { if (!ok) { failures++; console.error('FAIL:', msg); } };

/* ---------- English ---------- */
check(QUOTES.length === 55, `expected 55 quotes, got ${QUOTES.length}`);
check(new Set(QUOTES.map(q => q.id)).size === QUOTES.length, 'IDs are not unique');
QUOTES.forEach((q, i) => {
  check(q.number === i + 1, `order/number mismatch at index ${i}`);
  check(typeof q.title === 'string' && q.title.trim() === q.title && q.title.length > 0, `bad title ${q.id}`);
  check(typeof q.text === 'string' && q.text.trim() === q.text && q.text.length > 0, `bad text ${q.id}`);
  check(q.categories.length > 0 && q.categories.every(c => CATEGORIES.some(k => k.id === c)), `bad categories ${q.id}`);
  check(q.tags.length > 0, `no tags ${q.id}`);
  check(q.published === true, `unpublished ${q.id}`);
});
const dup = QUOTES.filter(q => q.title === 'Build Your Own Dream');
check(dup.length === 2 && dup[0].text !== dup[1].text, 'quotes 43 and 51 should both exist with different text');
check(QUOTES[11].text.split('\n').length === 3, 'quote 12 must keep its three numbered lines');
check(QUOTES.every(q => q.author === '' && q.sourceUrl === ''), 'no author/source should be invented');

const fp = crypto.createHash('sha256').update(JSON.stringify(QUOTES.map(q => [q.number, q.title, q.text]))).digest('hex').slice(0, 16);
check(fp === EXPECTED_ENGLISH_FINGERPRINT, `English content changed! fingerprint ${fp} (expected ${EXPECTED_ENGLISH_FINGERPRINT})`);

/* ---------- Arabic ---------- */
const ARABIC_LETTER = /[ء-ي]/;
const shape = s => s.replace(/[^\n]+/g, 'x'); // keeps only the line-break structure
check(Object.keys(QUOTES_AR).length === QUOTES.length, `expected ${QUOTES.length} Arabic entries, got ${Object.keys(QUOTES_AR).length}`);
QUOTES.forEach(q => {
  const a = QUOTES_AR[q.id];
  if (!a) { check(false, `missing Arabic for ${q.id}`); return; }
  check(typeof a.title === 'string' && a.title.trim() === a.title && ARABIC_LETTER.test(a.title), `bad Arabic title ${q.id}`);
  check(typeof a.text === 'string' && a.text.trim() === a.text && ARABIC_LETTER.test(a.text), `bad Arabic text ${q.id}`);
  check(shape(a.text) === shape(q.text), `line breaks differ between English and Arabic in ${q.id}`);
  check(!/[A-Za-z]/.test(a.title + a.text), `Latin letters inside Arabic ${q.id}`);
  check(!/[?,;]/.test(a.text), `Latin punctuation (? , ;) in Arabic text ${q.id}; use ؟ ، ؛`);
  check(/^“/.test(q.text) === /^«/.test(a.text) && (!/^“/.test(q.text) || /”$/.test(q.text) === /»$/.test(a.text)), `whole-quote quotation marks differ in ${q.id}`);
  check(/“[^”]+”/.test(q.text) === /«[^»]+»/.test(a.text), `inner quoted speech differs in ${q.id}`);
  check((q.text.match(/!/g) || []).length === (a.text.match(/!/g) || []).length, `exclamation marks differ in ${q.id}`);
});
check(new Set(Object.values(QUOTES_AR).map(a => a.text)).size === QUOTES.length, 'two Arabic texts are identical');

CATEGORIES.forEach(c => check(CATEGORIES_AR[c.id] && CATEGORIES_AR[c.id].name && CATEGORIES_AR[c.id].blurb, `missing Arabic category ${c.id}`));
const allTags = [...new Set(QUOTES.flatMap(q => q.tags))];
allTags.forEach(t => check(TAGS_AR[t], `missing Arabic tag "${t}"`));
Object.keys(TAGS_AR).forEach(t => check(allTags.includes(t), `unused Arabic tag "${t}"`));

console.log('English fingerprint:', fp);
console.log(`${QUOTES.length} quotes · ${Object.keys(QUOTES_AR).length} Arabic translations · ${allTags.length} tags translated`);
console.log(failures ? `${failures} check(s) failed` : 'OK — English and Arabic data validated');
process.exit(failures ? 1 : 0);
