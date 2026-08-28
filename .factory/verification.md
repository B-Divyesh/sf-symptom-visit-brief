# Independent verification — FAIL

**Candidate:** `1ca26c9067126f2db9def95ecc9d86a8786d90ae`  
**Live URL:** <https://symptom-visit-brief.sociobot.in>  
**Verified:** 2026-08-28 (UTC)  
**Decision:** **FAIL — do not release.**

The deployed files were byte-for-byte identical to a fresh production build of
the candidate, so these are candidate defects rather than a deployment-only
failure.

## Mandatory first checks

### Claims

**FAIL / release blocker.** `.factory/claims.json` does not exist in the clean
candidate. Therefore there were no claim commands that could be run from the
demo entry point, and no `@claim:` tests in the repository. The required
contract treats a missing manifest as a release-blocking failure.

This also leaves the observable statements in the README and product UI
unlisted and unproven, including offline use, on-device-only storage, CSV/PDF
export, and no analytics/third-party scripts. Evidence: `find`/`rg --files
--hidden` after checkout; source search of `README.md` and `src/main.ts`.

### Cold first read of live site

**FAIL / release blocker.** Cold desktop and 390 px visits showed:

> “Small observations. One useful timeline.”  
> “Capture what happened while it’s fresh. Bring a factual, date-bounded brief
> to your visit—without an account or cloud sync.”

I can infer that it records observations for a visit, but the first screen does
not plainly name the intended person, and its headline is a metaphor rather
than the job. More importantly, it offers only **Record an observation** and
**Prepare a visit brief**. It has no one-click **Try it with sample data**
action. This independently fails the explicit first-read acceptance rule.

Screenshots: `/tmp/svb-live-desktop.png`, `/tmp/svb-live-390-demo.png`.

### Demo sandbox

**FAIL / release blocker.** Neither `/demo` nor `/?demo=1` implements a demo:

- Live `/?demo=1`: zero matches for “Try it with sample data”, “Demo — sample
  data, nothing is saved”, “Reset demo”, and “Start for real”.
- In local production preview, I saved a real-namespace record named `QA
  boundary observation`, opened `/?demo=1`, and that exact record remained
  visible (`sharedRealRecord: 1`). There is no separate `demo:` storage
  namespace, sample seed, banner, reset, or exit control.
- `.factory/demo.md` is absent.

The demo URL is consequently just the normal app and can expose/mutate the
visitor's real browser records. It does not satisfy the required isolated demo
contract.

## Test and product evidence

Clean install and checks:

| Check | Result | Evidence |
| --- | --- | --- |
| `npm ci` | PASS install; audit warning | 78 packages installed. Default audit reported 1 moderate, 1 high, 1 critical dev dependency advisory; production-only audit reported 0. |
| `npm test` | PASS | 5/5 Vitest unit tests. |
| `npx tsc --noEmit` | PASS | No diagnostics. |
| `npm run build` | PASS | Built `dist/`; generated service worker with 23 precached files. |
| `npm run test:e2e` | PASS | 3/3 Playwright tests: record/persist/filter/export/offline, legal pages, mocked license return. |
| `npm audit --omit=dev` | PASS | 0 production vulnerabilities. |
| `npm audit` | FAIL finding | Direct `vite@6.1.0` high advisory and direct `vitest@3.0.6` critical advisory, plus transitive esbuild moderate advisory. |

I additionally exercised the local production preview at 390 px and desktop:

- Normal capture, photo preview/storage, reload persistence, filtering, CSV
  and PDF download: covered by the passing E2E suite.
- Boundary capture: saved a 10,080-minute observation and verified its timeline
  record appeared.
- Invalid/recovery: empty required symptom was natively invalid; invalid JSON
  import showed “That file is not a valid Symptom Visit Brief backup.”
- Offline: after service-worker control, offline reload displayed “Offline ·
  still saving” and retained the saved boundary record.
- Reduced motion: `prefers-reduced-motion: reduce` produced `scroll-behavior:
  auto`; CSS reduces animation/transition durations.
- Console/page errors: none during local E2E/manual flow or cold live visit.
- Outbound requests on a cold live visit: only
  `https://symptom-visit-brief.sociobot.in`. The optional license flow is the
  explicitly configured Sociobot API; no sign-in flow exists.

## Deployment, PWA, and endpoint evidence

- Fresh `dist/` comparison against the live URL: **all 24 deployed files
  matched SHA-256 byte-for-byte**, including HTML, every hashed asset,
  manifest, icons, legal pages, offline page, and `sw.js`.
- Manifest, service worker, offline reload, and local IndexedDB persistence are
  present and behaved as described above. The existing suite also verifies the
  offline reload path.
- Billing verify endpoint rate-limit test:
  `GET /api/v1/products/symptom-visit-brief/verify?license=…`, 60 rapid
  requests at concurrency 30, returned **30 × 200** then **30 × 429**. 429
  responses included `Retry-After: 2` or `3`; the effective threshold was
  about 30 requests in that burst (request ordering is concurrent). This
  requirement passes.
- Live root and JS headers include HSTS, `nosniff`, and Referrer-Policy, but no
  `Content-Security-Policy`. Hashed JS is served with only
  `Cache-Control: public, must-revalidate, max-age=30`, not immutable long-term
  caching.

## Accessibility and interface evidence

- Axe serious/critical: **0** on `/`, `/privacy/`, and `/terms/` in the local
  production preview.
- Semantic smoke check passes: `lang`, title, one h1, main landmark, skip
  link, labelled form controls, legal page landmarks, and no cold-load console
  errors.
- Keyboard smoke check reached the skip link, wordmark, hero actions, and
  native form fields; native validation was operable. No keyboard trap was
  observed.

However, the universal light-theme focus outline violates the required focus
contrast. `src/styles.css` sets `:focus-visible { outline: 3px solid #d19a15;
… }`; its measured contrast is **2.23:1** against `#f5f1e8` and **2.47:1**
against `#fffdf7`, below the required 3:1. Axe does not flag this style-only
failure.

## Defects

| Severity | ID | Defect | Evidence / required resolution |
| --- | --- | --- | --- |
| Blocker | V-001 | Required `.factory/claims.json` is missing; no claim tests can run. | Add a manifest and one observable demo-entry test per claim; remove any untestable claim copy. |
| Blocker | V-002 | No visible one-click sample-data demo or isolated demo mode. | Implement `/demo` or `?demo=1` with shipped realistic seed data, a persistent banner, reset/start-real controls, and separate storage; document it in `.factory/demo.md`. |
| Blocker | V-003 | First screen does not meet plain-words/demo acceptance. | Use a job-focused plain headline, name the person it is for, and place “Try it with sample data” on the first screen. |
| High | V-004 | Light-theme keyboard focus indicator is below the 3:1 required contrast. | Replace `#d19a15` focus treatment or add a ≥3:1 adjacent indicator; verify both themes. |
| Medium | V-005 | Live response policy omits CSP and immutable cache policy for fingerprinted assets. | Add deployment configuration for a CSP matching self-hosted assets and immutable caching for hashed files/service-worker update policy. |
| Medium | V-006 | Required route/metadata delivery is incomplete. | There is no canonical/OG/Twitter metadata in the HTML, no deployment config, and `/not-a-real-route` returns the normal app with HTTP 200 rather than a styled 404. |
| Medium | V-007 | Default dependency audit has high/critical direct dev-tool advisories. | Update/pin Vite and Vitest to patched compatible releases and refresh the lockfile; rerun audit. |

## Retest gate

Do not approve until V-001 through V-004 are fixed and all claim tests are run
from a fresh demo browser context. Re-run the complete clean-install test set,
mobile/desktop accessibility checks, PWA offline/update checks, and live
deployment identity comparison after the replacement candidate is deployed.
