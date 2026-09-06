# Verify symptom observations into a visit brief — independent verification 3

**Candidate:** `2120af7ae8fd19c83413930764fae189994d610e`  
**Documentation pointer:** `905048b345dac0d4f9f98b462c8c7dca33e9a1a0`  
**Live URL:** <https://symptom-visit-brief.sociobot.in>  
**Verified:** 2026-09-06 UTC  
**Verdict: FAIL — one medium finding; zero untested claims.**

The 29 public files from a fresh build of `2120af7` SHA-256-match the live
artifact. `staticwebapp.config.json` is intentionally host-private and returns
HTTP 404. The finding below is therefore in the reviewed candidate, not a
deployment mismatch.

## First read and main job

In fresh desktop (1440 px) and Pixel 5 browser contexts, before scrolling, the
page states the job: **“Turn symptom notes into a visit brief.”** It names the
audience: people with intermittent symptoms who need a factual clinician-visit
timeline. Its first action is **“Try it with sample data.”** The action was
visible in both viewports and loaded four realistic observations.

The live demo banner remained visible with “Demo — sample data, nothing is
saved to your records”, **Reset demo**, and **Start for real**. A newly saved
real record did not appear in demo; reset restored four samples; Start for real
returned to the real record. This confirms the required isolated demo path.

## Claim commands

After `npm ci`, every exact command in `.factory/claims.json` was run. Each
passed in both configured projects (desktop Chromium and Pixel 5); no claim was
skipped.

| Claim ID | Exact command | Result |
| --- | --- | --- |
| `demo-sandbox` | `npm run test:e2e -- --grep @claim:demo-sandbox` | PASS (2/2) |
| `offline-reload` | `npm run test:e2e -- --grep @claim:offline-reload` | PASS (2/2) |
| `on-device-records` | `npm run test:e2e -- --grep @claim:on-device-records` | PASS (2/2) |
| `csv-export` | `npm run test:e2e -- --grep @claim:csv-export` | PASS (2/2) |
| `pdf-export` | `npm run test:e2e -- --grep @claim:pdf-export` | PASS (2/2) |
| `json-backup` | `npm run test:e2e -- --grep @claim:json-backup` | PASS (2/2) |
| `no-third-party-tracking` | `npm run test:e2e -- --grep @claim:no-third-party-tracking` | PASS (2/2) |
| `plus-price` | `npm run test:e2e -- --grep @claim:plus-price` | PASS (2/2) |
| `observation-details` | `npm run test:e2e -- --grep @claim:observation-details` | PASS (2/2) |
| `timeline-filters` | `npm run test:e2e -- --grep @claim:timeline-filters` | PASS (2/2) |
| `backup-merge` | `npm run test:e2e -- --grep @claim:backup-merge` | PASS (2/2) |
| `plus-settings` | `npm run test:e2e -- --grep @claim:plus-settings` | PASS (2/2) |
| `license-verification` | `npm run test:e2e -- --grep @claim:license-verification` | PASS (2/2) |

The full browser suite also passed: **36/36** (`test-results/.last-run.json`
reports `status: passed`). `npm run check`, `npm audit --omit=dev`, `npm audit`,
and `git diff --check` passed. The fresh build writes `dist/` and keeps initial
app JavaScript at 10.93 KB gzip and CSS at 6.10 KB gzip.

## Live product checks

- Fresh desktop and phone contexts controlled the live service worker. After
  going offline and reloading `/demo`, each showed “Offline · still saving”
  and all four samples. The update-notification UI handler displayed “A fresh
  version is ready. Refresh” when the live service-worker message was emitted.
- Normal capture worked. Required symptom validation showed “Please fill out
  this field.” A severity-10, 10,080-minute boundary record saved. An unmatched
  search showed the recovery state; Clear filters restored five observations.
  Invalid JSON import showed the documented recovery message. Live CSV export
  contained the expected header.
- Desktop keyboard starts at the skip link. The visible focus outline is
  `rgb(0, 107, 99)`; reduced motion sets scroll behavior to `auto` and reduces
  transitions. Repeated live Axe scans found zero serious/critical issues on
  `/`, `/demo`, `/privacy/`, `/terms/`, and the styled 404. The required
  `verify-url.sh` check passed on `/demo` with title, `lang`, one h1, main,
  alt text, labelled buttons, and no console errors.
- Live demo requests were same-origin only. Root, demo, privacy, and terms
  have CSP, Permissions-Policy, strict referrer policy, and `nosniff`. Internal
  links return 200; the designed unknown route returns its deliberate HTTP 404.
- Fresh Lighthouse 13.4.1 mobile measurement: root **100/100/100/100**
  (Performance/Accessibility/Best Practices/SEO). Demo is
  **100/100/100/92**; the SEO deficit is the finding below.

## Earlier findings disposition

| Earlier finding | Current disposition |
| --- | --- |
| V-001 claims missing | Fixed: 13-item manifest, exact observable tests all pass. |
| V-002 demo absent/shared storage | Fixed: live isolated four-record demo, reset, and real-data return verified. |
| V-003 first screen unclear/no sample action | Fixed in both fresh desktop and phone checks. |
| V-004 low-contrast focus | Fixed: teal focus treatment verified. |
| V-005 CSP/cache policy | Fixed: live CSP/policy headers verified, including `/demo`. |
| V-006 metadata/routing/404 | Routing, titles, and styled HTTP 404 are fixed; its canonical concern now has the new precise finding below. |
| V-007 dependency audit | Fixed: both audit commands report zero vulnerabilities. |
| V2-001 live service-worker installation | Fixed: fresh live controller and offline reload pass on desktop and phone. |
| V2-002 `/demo` security policy | Fixed: live `/demo` carries CSP and Permissions-Policy. |
| V2-003 unlisted public claims | Fixed: all listed capabilities have manifest entries and passing demo tests. |

## Finding

| Severity | ID | Finding | Evidence and repair |
| --- | --- | --- | --- |
| Medium | V3-001 | `/demo` declares the landing page as its canonical URL while the sitemap lists `/demo` as a public route. Lighthouse therefore reports “Document does not have a valid rel=canonical” and gives the live demo SEO 92 rather than a clean audit. | Live `/demo` serves `<link rel="canonical" href="https://symptom-visit-brief.sociobot.in/">`; `/privacy/` and `/terms/` use self canonicals. Set the canonical (and matching `og:url`) to `/demo` when demo is the public route, or deliberately remove it from the sitemap and make it non-indexable. Re-run the live demo Lighthouse audit. |

## Retest gate

Do not mark this release PASS until V3-001 is repaired and deployed. Re-run the
live `/demo` metadata/Lighthouse check, all declared claim commands, and the
artifact comparison. No product code was modified during this verification.
