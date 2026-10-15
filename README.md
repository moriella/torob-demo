# ترب گوشی — دموی «ترب … رو بساز»

یک دموی کوچک برای چالش AI Product Engineer ترب: نتایج زنده‌ی جست‌وجوی ترب را می‌گیرد، پاک‌سازی می‌کند و بر اساس قصدی که کاربر به فارسی می‌نویسد رتبه‌بندی و توضیح می‌دهد.

A small demo for Torob's AI Product Engineer challenge. It fetches live Torob search results for phones, cleans them, and ranks them by a plain-language Persian intent such as «ارزان‌ترین گوشی نو با حافظه ۲۵۶», with an explanation of why #1 won.

## Run

Needs Node 18+. No dependencies.

```
node server.js
# open http://127.0.0.1:8787
```

Demo video: [`demo.mp4`](demo.mp4) (silent, ~50 s).

## How it works

1. **Fetch:** `server.js` is a small local proxy for Torob's search API, because the browser cannot call it directly (no CORS). Responses are cached for 10 minutes, requests are serialized with at least 1.5 s between them, and the User-Agent says what this is.
2. **Clean:** rows that are accessories, ads, brand mismatches, "طرح اصلی" clones, or used phones are dropped, with the reason shown. Storage and RAM are parsed from titles.
3. **Intent:** a rule-based Persian parser turns the sentence into weights and filters (price, storage, RAM, shop count, used/clone allowed).
4. **Rank + explain:** a weighted score ranks the remaining phones and produces a short explanation versus the runner-up.

The rule-based intent parser is deliberately simple and deterministic; an LLM would be the next step for free-form intent.

## Notes

- Unofficial and non-commercial. Not affiliated with Torob; the logo and name belong to Torob.
- Prices are shown exactly as Torob returns them and change over time.
- Torob's `robots.txt` disallows `/search/` on the website. This project uses their separate search API at very low volume, with caching.
