# Little Wisdom

An illustrated digital magazine of 55 quotes. Plain HTML, CSS and JavaScript. No frameworks, no build step.

## Run it

Open `index.html` in a browser, or serve the folder:

```
python3 -m http.server 8080    # then visit http://localhost:8080
```

Clipboard copy needs a secure context (HTTPS or localhost). On plain `file://` it falls back to a legacy copy method.

## Files

| File | Purpose |
|---|---|
| `index.html` | Page shell, navigation, footer |
| `style.css` | Design tokens, typography, layouts, components |
| `quotes.js` | The 55 English quotes (single source of truth) and the 7 categories |
| `quotes-ar.js` | Saudi Arabic layer: titles, texts, category names/blurbs, 79 tags. English stays the source; a missing translation falls back to English |
| `i18n.js` | Language switch (English / العربية), all interface strings, `<html lang dir>`, Arabic plural forms |
| `scenes.js` | Eight original SVG illustrations in one Japanese-home art direction (panoramic room, rain garden, desk, morning, veranda, train, night lane, autumn) |
| `script.js` | Router, rendering, search, filters, bookmarks, copy, share, time-of-day and season |
| `TRANSLATION_NOTES.md` | Translation caveats and decisions that need a native reader's review |
| `validate.js` | `node validate.js` checks the dataset (count, IDs, order, duplicates, no invented sources) |

Views: Home `#/`, All quotes `#/library` (search + filters), Quote `#/quote/q07`, Bookmarks `#/bookmarks`.

## Navigation model

- Every quote page has **Previous quote / Next quote** at the top (first screen on every device) and again under **Continue reading**, with the neighbouring quote's title. Related quotes come after, and never replace them.
- Order is the original collection order (01 to 55). At the first and last quote the unavailable button is shown disabled with a plain message, and the last quote offers "Start again from quote 01".
- **Browsing context:** opening a quote from filtered results or from Bookmarks carries the filter in the URL (`#/quote/q12?cat=faith`, `?saved=1`). Next/Previous then walk only that list, the page says so ("3 of 5 in Faith & Perspective") and offers "Browse all 55 instead". A stale or invalid context falls back to the whole collection.
- Keyboard: Left/Right arrows step between quotes, except while typing in a field or with a modifier key held.
- Filters on the All quotes page live in the URL, so refresh, Back and shared links restore them.
- The home page's "Quote of the day" is chosen by the local calendar date; "Show another" picks a different one.

## Design: a quiet Japanese home

- **Principles:** ma (space to breathe), wabi-sabi (natural, slightly imperfect), shibui (understated). Typography leads; paper, wood and light stay behind it.
- **Type:** Cormorant Garamond for titles and short quotes, Lora for longer quotes and body, Inter for the interface. Arabic: Noto Naskh Arabic for quotes and headings, IBM Plex Sans Arabic for the interface. No tracked uppercase labels; Quote 52 (typed in capitals) is set smaller so it does not shout.
- **Tokens** live at the top of `style.css` (colour, type scale, spacing, radii, shadows, motion). Layout uses logical properties, so right-to-left needs very little extra CSS.
- **Pages:** home introduces the room (greeting, panoramic scene, one quiet quote of the day, a bookshelf of themes); library is search-first; a quote page is one centred thought under a wide illustration; bookmarks is a ruled notebook.
- **Returning visits:** the quote of the day changes by calendar date; the greeting and the light on the hero scene follow the visitor's local hour; the accent colour shifts with the season (Japan's four seasons by month); a "Continue where you left off" link remembers the last quote (`littlewisdom.last.v1`). No popups, no notifications.
- **Motion:** a short fade between pages, a small bookmark pop, and faint rain/steam on two large illustrations. All of it is off under `prefers-reduced-motion`.

## Language (English / العربية)

- The switch is in the header. The choice is saved (`littlewisdom.lang.v1`); a first visit follows the browser language.
- Switching re-renders the same page in place (same quote, filters and scroll position).
- Arabic mode shows the original English under each translated quote. Search matches both languages and ignores Arabic spelling variants (أ/إ/ا, ى/ي, ة/ه, diacritics).
- Arrow keys follow the screen direction (in Arabic, left = next).
- The translations are a first pass written in natural Saudi Arabic and must be reviewed by a native reader before publishing; see `TRANSLATION_NOTES.md`.

## Content rules

- `title` and `text` are verbatim. Quote 12 keeps its three numbered lines; Quotes 23 and 24 keep their line breaks.
- Quotes 43 and 51 share a title but are separate records.
- `author` and `sourceUrl` are empty everywhere. Nothing was supplied, so nothing was invented. When you add verified sources, the Source filter and the attribution line on the quote page appear automatically.
- Categories, tags and illustration assignments are editorial metadata I added. Edit them freely in `quotes.js`.

## Bookmarks

Stored in `localStorage` under `littlewisdom.bookmarks.v1`. They persist across reloads in the same browser and do not sync across browsers or devices.

## Admin dashboard: not included, on purpose

A dashboard that edits a shared, public collection cannot be secured from front-end code alone. Hiding `admin.html` or checking a password in JavaScript protects nothing. So none is shipped. Smallest practical design that keeps the HTML/CSS/vanilla-JS stack:

1. **Data:** move `quotes.js` content into a database table (or a JSON file in object storage) with the same fields, plus `updated_at`.
2. **API:** a small server (for example Node + Express, or a serverless function) exposing `GET /api/quotes` (published only, public) and `POST/PUT/DELETE /api/admin/quotes` (protected).
3. **Auth:** server-side sessions with a password hash (argon2/bcrypt) or an identity provider, `HttpOnly; Secure; SameSite=Strict` cookies, CSRF tokens, rate-limiting, and HTTPS only. Secrets live in environment variables.
4. **Admin UI:** a separate `admin.html` in vanilla JS that talks to those endpoints: create/edit, categories and tags, verified sources, illustration picker, layout preview, publish toggle, search, and a "missing metadata" filter.
5. **Public site:** `script.js` loads quotes from `GET /api/quotes` instead of `quotes.js`. Nothing else changes.

## Not yet done / known limits

- Fonts come from Google Fonts. Offline, the site falls back to system serif and sans-serif. The final typefaces could not be seen in the build sandbox (web fonts blocked); check them in a real browser.
- Per-quote link previews (WhatsApp, X) need a server or pre-rendered pages; a hash-routed site cannot provide them.
- Illustrations are stylised vector scenes, not painted artwork. Swap in licensed or commissioned images by replacing the SVGs in `scenes.js` or pointing `image` at files.
