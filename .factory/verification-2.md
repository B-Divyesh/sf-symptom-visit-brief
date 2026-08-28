# Independent verification 2 — FAIL

**Candidate:** `5be1ad3d70c1ffffe146ffc96827299fc5fc7944`  
**Live URL:** <https://symptom-visit-brief.sociobot.in>  
**Verified:** 2026-08-28 UTC  
**Decision:** **FAIL — do not release.**

The deployed public artifacts match this candidate, so the release blocker below is fresh candidate/deployment evidence, not an earlier unrelated deployment report.

## First read

A cold live visit plainly says: “Turn symptom notes into a visit brief,” then “For people with intermittent symptoms who need a factual timeline for a clinician visit.” The first action is **Try it with sample data**, with the nearby explanation that it loads four observations in a separate workspace. This meets the first-read, plain-words, and one-click-demo gate.

## Required claim checks

`.factory/claims.json` exists. From this clean checkout, after `npm ci`, I ran every exact command in it through the configured production demo entry point. All passed in both Chromium desktop and Pixel 5 profiles (two results per command):

| Claim | Exact command | Result |
| --- | --- | --- |
| Separate sample workspace | `npm run test:e2e -- --grep @claim:demo-sandbox` | PASS (2/2) |
| Offline reload | `npm run test:e2e -- --grep @claim:offline-reload` | PASS (2/2, local preview only) |
| On-device record isolation | `npm run test:e2e -- --grep @claim:on-device-records` | PASS (2/2) |
| CSV export | `npm run test:e2e -- --grep @claim:csv-export` | PASS (2/2) |
| One-page PDF | `npm run test:e2e -- --grep @claim:pdf-export` | PASS (2/2) |
| JSON backup | `npm run test:e2e -- --grep @claim:json-backup` | PASS (2/2) |
| No third-party tracking | `npm run test:e2e -- --grep @claim:no-third-party-tracking` | PASS (2/2) |
| $9 one-time price | `npm run test:e2e -- --grep @claim:plus-price` | PASS (2/2) |

The local offline claim result does **not** represent the deployed result: V2-001 below prevents installation on the actual host.

## Clean candidate checks

| Check | Result | Evidence |
| --- | --- | --- |
| `npm ci` | PASS | 84 packages installed; 0 vulnerabilities reported. |
| `npm run check` | PASS | TypeScript clean, Vitest 5/5, exact production build. |
| `npm run test:e2e` | PASS | 26/26 across desktop and Pixel 5. |
| `npm audit --omit=dev` / `npm audit` | PASS | Both reported 0 vulnerabilities. |
| `git diff --check` | PASS before verifier documentation changes | No whitespace errors. |

Production build: initial app JS is 31.45 kB (10.99 kB gzip) plus a 0.71 kB style module; CSS is 22.82 kB (6.10 kB gzip). The PDF implementation is deferred. These are within the static/PWA initial JS and CSS budgets.

## Independent product and accessibility exercise

On the live `/demo` at 390 px I confirmed the persistent demo banner, four realistic samples, separate demo start/reset actions, normal capture, and recovery paths. An empty symptom produced native “Please fill out this field.” validation. A 10,080-minute, severity-10 observation saved as a fifth record; an unmatched search showed the recovery empty state; a malformed JSON import showed “That file is not a valid Symptom Visit Brief backup.”; and CSV downloaded (`symptom-visit-brief-all.csv`, 812 bytes). The visible keyboard focus outline was `rgb(0, 107, 99)`, 3 px; `prefers-reduced-motion: reduce` yielded `scroll-behavior: auto`.

Live desktop cold-load and live 390 px demo checks had no console/page errors. Axe via Playwright found zero serious/critical violations on the live root and live demo. The complete local suite also covers keyboard skip-link use, dark/light focus, legal and 404 landmarks, PDF/JSON export, persistence, filters, and offline behavior in a local preview.

The live demo-flow request log contained only `https://symptom-visit-brief.sociobot.in`; no analytics, ad, CDN, or other third-party request occurred. There is no sign-in flow. The optional license verification endpoint was independently rate-tested: 40 sequential requests from this client returned 30 × 200 followed by 10 × 429; each 429 carried `Retry-After` of 2–3 seconds. Observed allowance: **30 requests per burst/window**.

## Deployment identity and headers

After the exact candidate build, SHA-256 comparison matched all 29 externally served files: HTML, hashed JS/CSS, images, font, icons, manifest, service worker, legal pages, offline page, robots, and sitemap. Live `/`, `/demo`, `/privacy/`, and `/terms/` return 200; an unknown route returns the styled HTTP 404. Root security headers include HSTS, `nosniff`, strict cross-origin Referrer-Policy, Permissions-Policy, and the self-only CSP. Hashed JS is `public, max-age=31536000, immutable`; `sw.js` is no-cache/no-store.

## Defects

| Severity | ID | Finding | Fresh evidence / required resolution |
| --- | --- | --- | --- |
| **Blocker** | **V2-001** | **Live PWA service worker cannot install, so the public offline and update requirements fail.** | A fresh live `/demo` context invoked `navigator.serviceWorker.register('/sw.js')`, but after 5 seconds `getRegistrations()` was empty and there was no controller. The generated `sw.js` `SHELL` has 29 entries, including `/staticwebapp.config.json`; on the static host that configuration file is intentionally not public and returns HTTP 404. `cache.addAll(SHELL)` therefore rejects during `install`, leaving the registration discarded. Local preview passes because it serves that file. Exclude deployment-only configuration from precache (and test the built artifact against host-equivalent serving), redeploy, then prove a live first-visit offline reload and update toast. |
| **Medium** | **V2-002** | `/demo`, the primary data-entry/demo route, does not receive the declared CSP or Permissions-Policy. | Live `/` and legal routes return the specified CSP and Permissions-Policy, but live `/demo` returns neither and has `Referrer-Policy: same-origin` instead of the configured strict cross-origin policy. The exact `/demo` rewrite route takes precedence over the catch-all header route. Apply the security headers to the rewrite route or a host-supported global policy and verify the live response. |
| **High** | **V2-003** | Several visitor-facing capability claims have no corresponding claim-manifest entry/test. | The manifest covers privacy, demo, exports, offline, and price, but not README claims that the app records all stated fields and filters by dates/text, nor visible claims that import merging keeps existing history with newer edits winning, that Brief Plus saves presets/personalized headings, or that no account/subscription is needed. The claims contract requires one observable demo-entry test per relied-on claim; add tests or reduce the copy to what is listed and proven. |

## Retest gate

Do not approve this candidate. Repair V2-001 and V2-002 in a new candidate, reconcile V2-003, deploy it, and rerun the full clean-install suite plus a **live** service-worker install, offline reload, and update check. The source/product code was not changed during this verification; only this report and the handoff were updated.
