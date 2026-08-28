# Handoff — Symptom Visit Brief v1

## Independent verification outcome — FAIL

Candidate `1ca26c9067126f2db9def95ecc9d86a8786d90ae` was independently verified
against <https://symptom-visit-brief.sociobot.in> on 2026-08-28 UTC and **must
not be released**. The live deployment is byte-for-byte the candidate build,
not a deployment-only failure.

Release blockers are: missing `.factory/claims.json` (therefore no required
claim tests), no one-click sample-data action on the first screen, and no
isolated demo implementation at `/demo` or `?demo=1`. Direct `?demo=1` shares
normal IndexedDB records instead of using a demo namespace. The first screen
also does not plainly name the intended user. See
[`verification.md`](verification.md) for exact test output, live observations,
and all severities.

The core app build/unit/E2E tests, local offline reload, rate limit, and live
byte comparison passed. Remaining non-blocking findings include a sub-3:1
light-theme focus outline, absent CSP/immutable asset caching, missing
canonical/social metadata and 404 behavior, and high/critical dev-tool audit
advisories.

## What was built

- A production-ready Vite + vanilla TypeScript PWA for private symptom observations.
- IndexedDB persistence for date/time, symptom, accessible 1–10 severity, duration, context, and optional locally compressed photo. Records survive refresh, tab close, and offline use.
- Chronological review with inclusive date filters, text search, plain counts, observed-day count, total duration, average severity, and a clearly worded first-half/second-half comparison. No diagnostic scoring or advice.
- One-page PDF generation, complete CSV export, and versioned JSON backup/import. Import is non-destructive: it merges by record ID and uses `updatedAt` for visible last-write-wins behavior.
- Offline shell precaching, runtime asset caching, versioned caches, `skipWaiting`, `clients.claim`, and an in-app refresh notice for genuine updates. Manifest includes 192/512 and maskable icons plus shortcuts.
- Original “signal constellation” art direction and generated hero illustration, responsive WebP delivery, self-hosted Atkinson Hyperlegible Next, light/dark treatments, reduced-motion fallback, and 390 px responsive layout. Prompt, model route, date, review, and licensing notes are in `.factory/design.md` and `assets/src/`.
- Standalone `/privacy/` and `/terms/` pages, safety language, README, MIT license, sitemap, and robots file.
- $9 one-time Brief Plus integration using the Sociobot contract: hosted checkout link, URL token capture/removal, `sb_license:symptom-visit-brief` local storage, once-daily verification cache, background reconciliation, offline optimistic unlock, and paste-to-restore. Paid convenience adds presets and personalized headings; core capture, accessibility, photos, and all exports stay free.

## Run and verify

```sh
npm ci
npm test
npm run check
npm run test:e2e
npm run build
```

Deploy exactly `dist/`; `dist/index.html` is at its root. The production build uses `https://api.sociobot.in/api/v1`. Set `VITE_BILLING_API_BASE=https://pilot-api.sociobot.in/api/v1` for staging checkout and verification.

Verification completed on 2026-08-28:

- `npm test`: 5/5 unit tests passed.
- `npm run check`: TypeScript, unit tests, and production build passed.
- `npm run test:e2e`: Chromium Pixel 5 profile passed capture, photo preview/storage, reload persistence, filtering, CSV download, PDF download, axe scan, offline reload, legal pages, and mocked license-return verification.
- Production dependency audit: 0 vulnerabilities (`npm audit --omit=dev`).
- Production output: initial app JS 28.53 KB (10.08 KB gzip), CSS 21.21 KB (5.80 KB gzip), self-hosted font 34 KB, mobile hero 12 KB. PDF code is a deferred, offline-precached chunk and is not part of first load.
- Lighthouse 13 mobile, local production preview: Performance 100, Accessibility 100, Best Practices 100, SEO 100. FCP 1.1 s, LCP 1.7 s, TBT 30 ms, CLS 0, Speed Index 1.1 s, interactive 1.7 s.
- Axe: no serious or critical violations on the main app. Browser console: no errors during the complete offline E2E path.

## Known gaps and next steps

- The factory still needs to register the production and test products with the Sociobot billing engine. The app uses only the slug and has no hard-coded payment-provider ID. The client flow is covered with a mocked valid API response; no real payment was made from this build container.
- To guarantee one page, the PDF displays the first 12 chronological matching observations and states how many remain. The companion CSV always includes every matching record. Photos stay in the private local record and the PDF marks their presence rather than embedding sensitive images.
- IndexedDB storage is browser/device local by design. Users should make JSON backups before clearing site data or changing devices; cloud sync and provider portals are explicit non-goals.
