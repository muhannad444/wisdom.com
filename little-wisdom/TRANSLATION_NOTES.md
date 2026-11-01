# Arabic translation notes

Status: **first-pass translation, not yet reviewed by a native Saudi reader.** Please have one read all 55 before you publish. The English text in `quotes.js` is untouched and remains the source of truth; Arabic lives only in `quotes-ar.js`.

## Style used
Simple, broadly understood Saudi conversational Arabic: `إنت`, `اللي`, `مو`, `شي`, `عشان`, `تبي`, `وش`, future with `بـ` (`بتلقى`, `بيجي`). No heavy regional slang, so it reads naturally in Najd, Hijaz and the other regions. Quoted speech uses « ».

## Places where the original could not be carried over exactly
| # | Issue | What I did |
|---|---|---|
| 13, 28, 52, 55 | The English uses CAPITALS for emphasis (`DO`, `HOW CAN I`, `QUOTES WON'T WORK UNLESS YOU DO.`). Arabic has no capitals. | The emphasis is not reproduced. The Arabic is plain. |
| 14 | `HOW` is emphasised in English. | Same: emphasis is lost. |
| 24 | `Watch him` does not say who "him" is (someone to learn from? a role model?). | Translated literally (`راقبه`) and left unspecified. I did not add an interpretation. |
| 47 | `kill the free time`. A literal Arabic `قتل الوقت` means *wasting time*, which is the opposite. | Used `قضيت على وقت الفراغ` (eliminate the free time). Please confirm this is what the author meant. |
| 49 | "suffer from … knowing when to start" is ambiguous (difficulty knowing when, or a habit of overthinking it). | Kept the same structure: `معرفة متى نبدأ`. |
| 53 | `class` could mean school lesson or university lecture. | Used `الحصة` (school-style); change to `المحاضرة` if the audience is university students. |
| 41 | The supplied text says "Teach me, and I **remember**". Widely circulated versions say "I forget". | Translated exactly as supplied (`أتذكّر`). Not corrected. |
| 44 | "Do not be stupid" is blunt. | Kept equally blunt (`لا تكون غبي`). |
| 34 | "piss you off" is vulgar in English. | Used `تنرفزك`, a common Saudi word of similar strength but less crude. |
| 16 | Close to a well-known Arabic saying (`الناس أعداء ما جهلوا`). | Translated the English as supplied. You may prefer the classical wording; attribution is not claimed. |
| 18 | "creating" (making things, as opposed to consuming). | `الإبداع`, which is slightly broader than "making". Alternative: `الصناعة`/`الإنتاج`. |
| 1 | "the only one" means unique, but could also be read literally. | Kept literal: `الوحيد`. |

## Attribution flags (nothing added to the data)
These quotes are widely circulated and often credited to specific people. I have **not verified any attribution** and have not added any. Verify before filling `author`/`sourceUrl`:

- 32 ("The timing will never be just right…"), 34 ("The truth will set you free, but first…"), 38 ("Only a fool learns from his own mistakes…"), 41 ("Teach me, and I remember…"), 45 ("The only way to do great work is to love what you do.") are commonly attributed to named people online.
- 16, 30, 31, 36 read like proverbs or sayings of Arabic/Islamic origin and may have a traceable source.

## Product decisions to confirm
- The Arabic hero title is `حكمة صغيرة`. The header wordmark stays "Little Wisdom" in both languages (treated as the brand). Say if you want an Arabic brand name instead.
- Arabic labels use **المحفوظات** for "Bookmarks" (it could also be **المفضلة**).
- Digits stay Western (1, 2, 3), which is the usual choice in Saudi digital products.
