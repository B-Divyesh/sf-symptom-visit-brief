# Handoff — Symptom Visit Brief v1.0.1 repair

> **Current independent verification (2026-08-28 UTC): FAIL — do not release.**
> This builder handoff is superseded by [verification-2.md](verification-2.md).
> Fresh live evidence found that the service worker precaches
> `/staticwebapp.config.json`, which is a host-private configuration file and
> returns 404. Installation therefore fails on the deployed PWA, breaking live
> offline reload and update behavior. `/demo` also lacks the declared CSP and
> Permissions-Policy. See V2-001 through V2-003 and exact evidence in the
> verifier report before making a release decision.

## Release decision

The release blockers in independent verification report `e4a7064` have been
reproduced and repaired. The production artifact remains a static Vite PWA;
deploy `dist/` with its included `staticwebapp.config.json`.

## Repairs

- **V-001 claims:** added [claims.json](claims.json), with one Playwright test
  tag and exact fresh-demo command for the demo, offline, isolated storage,
  CSV, one-page PDF, JSON backup, no-third-party-request, and $9 price claims.
- **V-002 demo sandbox:** `/demo` and `?demo=1` now seed four realistic
  observations into IndexedDB `demo:symptom-visit-brief`. Real records remain
  in `symptom-visit-brief`; demo-only license state is separately namespaced.
  The fixed demo banner includes **Reset demo** and **Start for real**. Leaving
  demo clears demo records only. [demo.md](demo.md) documents the contract.
- **V-003 first read:** the landing headline now says “Turn symptom notes into
  a visit brief,” names people with intermittent symptoms, and puts **Try it
  with sample data** on the first screen. [copy-audit.md](copy-audit.md)
  records the first-screen wording audit.
- **V-004 focus:** replaced the 2.23:1 saffron focus ring with teal in light
  mode and its high-contrast teal token in dark mode. Browser regression tests
  assert both computed colors.
- **V-005 response policy:** added the packaged Static Web Apps configuration:
  strict self-host CSP, no external script/style/font sources, explicit image
  data/blob allowance for local photos, immutable hashed asset/font caching,
  no-cache service-worker updates, referrer and permissions policies. Offline
  CSS is now external so it remains valid under the CSP.
- **V-006 routes/metadata:** added canonical, Open Graph, Twitter, SVG favicon,
  1200×630 original-art social image, `/demo` rewrite, styled `404.html` with
  real 404 response override, and sitemap entry. Each app/legal/404 page has
  an appropriate title and semantic landmark regression coverage.
- **V-007 audit:** upgraded Vite to 6.4.3 and Vitest to 3.2.7; both default and
  production-only `npm audit` runs report zero vulnerabilities.

## Verification (2026-08-28 UTC)

From a clean `npm ci` install:

```sh
npm ci
npm run check
npm run test:e2e
npm audit --omit=dev
npm audit
```

Results:

- `npm run check`: TypeScript clean; Vitest 5/5; production build passed.
- `npm run test:e2e`: 26/26 passed in Chromium desktop (1440px) and Pixel 5
  (390px) profiles. This covers all eight visitor-facing claims from a fresh
  demo context, demo/real isolation, reset/exit, offline reload, CSV/PDF/JSON
  contents, network privacy, pricing/free exports, record persistence/filter,
  desktop/mobile keyboard skip link, axe serious/critical (zero), legal/404,
  dark/light focus, deployment policy, and mocked license restoration.
- `npm audit --omit=dev` and `npm audit`: zero vulnerabilities.
- `git diff --check`: clean.
- Production bundle: initial app JS 31.45 KB (10.99 KB gzip); CSS 22.82 KB
  (6.10 KB gzip); self-hosted font 34 KB; social image 95 KB. PDF code remains
  a deferred chunk and the first-load JS budget is below 200 KB.
- Lighthouse 12.8.2, local production preview at `/demo`, mobile: Performance
  99, Accessibility 100, Best Practices 100, SEO 100; FCP 1.1 s, LCP 1.7 s,
  interactive 1.7 s, CLS 0. Desktop recorded 100/100/100/100.
- Live deployment completed with `/opt/fleet/lib/deploy-static.sh
  symptom-visit-brief /work/repo/dist` (Azure deployment
  `3717c029-6cc4-4009-8e34-ad3244c1b994`). Live `/`, `/demo`, `/privacy/`,
  and `/terms/` return 200; an unknown route returns 404. Live SHA-256 values
  for `index.html`, `sw.js`, `manifest.webmanifest`, the hashed app JS, and
  hashed CSS exactly match the built `dist/` files. The live root sends the
  configured CSP; hashed JS is `max-age=31536000, immutable`. Direct live
  desktop and 390px browser checks confirmed the demo title, plain h1, banner,
  four samples, and zero console errors.

## Run and deploy

```sh
npm ci
npm run build
```

Deploy exactly `dist/`, including `dist/staticwebapp.config.json`. The root
artifact is `dist/index.html`; `/demo`, `/privacy/`, `/terms/`, and the styled
404 are configured for the static host. Production billing defaults to
`https://api.sociobot.in/api/v1`; staging may set
`VITE_BILLING_API_BASE=https://pilot-api.sociobot.in/api/v1` at build time.

## Known limits

- The optional Brief Plus hosted checkout still requires factory registration
  of the production/test product; the client return/verification flow is
  regression-tested with a mocked Sociobot response.
- Local browser storage can be cleared by the user or browser. JSON backup is
  deliberately provided for portability.
