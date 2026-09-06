# Handoff — Symptom Visit Brief v1.0.2

**Release decision: PASS.** The failed candidate `5be1ad3` must remain
superseded. The deployed implementation is
`2120af7ae8fd19c83413930764fae189994d610e`; it contains the PWA repair in
`298a16314d0fb965f5e5618e08cc0312955403e3` and the versioned release update.
The verification handoff documentation commit is
`905048b` (this follow-up commit only records that SHA pointer). The preceding
independent-verification documentation was `27a5af380b170d72d9b35410a87f614502365325`.

## What changed

- **V2-001, live PWA installation:** the service-worker generator excludes
  `staticwebapp.config.json`. Azure Static Web Apps consumes that deployment
  file but deliberately returns 404 for it, so precaching it had made
  `cache.addAll` reject and discarded the registration. Playwright now uses a
  host-equivalent preview that also hides that file, so the offline claim fails
  locally if this mistake returns.
- **V2-002, `/demo` policy:** security headers moved to Static Web Apps
  `globalHeaders`. `/demo` now receives the same CSP, Permissions-Policy,
  strict referrer policy, and `nosniff` response header as the rest of the app.
- **V2-003, claims:** the manifest now covers saved field/photo details,
  date/text filtering, non-destructive newer-wins backup merge, Brief Plus
  settings, and license-verification privacy. Each is an observable
  `/demo`-based browser test. The untestable no-account/subscription wording was
  removed instead of being asserted by source text.
- Replaced remaining metaphor headings with task names, gave the closed
  license-verify control an explicit accessible name, and widened the desktop
  demo banner columns so its sample explanation remains readable.
- Bumped the PWA cache/release to `1.0.2` (`start_url` `?v=2`) and checked a
  real live v1.0.1 → v1.0.2 update notification.

The paid offer remains a $9 one-time Brief Plus license for reusable symptom
presets and personalized visit-brief headings. Core capture and every export
remain free. Public billing metadata is in
`/work/.evidence/billing-offer.json`; the catalog description is in
`.factory/catalog-description.txt` and `/work/.evidence/catalog-description.txt`.

## Verification

From a fresh documented setup:

```sh
npm ci
npm run check
npm run test:e2e
npm audit --omit=dev
npm audit
```

- `npm run check`: TypeScript clean, 5/5 Vitest tests, and production build.
- Every exact command in `.factory/claims.json` was run from the demo entry
  point in desktop Chromium and Pixel 5. All 13 claims passed. The final full
  suite passed **36/36** at v1.0.2.
- Both audit commands report 0 vulnerabilities.
- `git diff --check` passed before the handoff update.
- The host-equivalent preview returns deployment configuration as 404, applies
  `/demo` headers, serves a styled 404, and still passes the offline reload
  claim. This is an outcome check, not a source-string configuration test.
- Local Lighthouse 12.8.2 on `/demo`: Performance **98**, Accessibility
  **100**, Best Practices **100**, SEO **100**; FCP 1.5 s, LCP 2.1 s,
  interactive 2.1 s, CLS 0.
- `verify-url.sh` passed locally and live for `/demo`: title, language, one
  h1, main landmark, alt text, labelled controls, and no console errors.
  Direct live Axe scans found 0 serious/critical findings on `/`, `/demo`,
  `/privacy/`, and `/terms/`.
- Initial app JS is 31.42 KB (10.93 KB gzip); CSS is 22.85 KB (6.10 KB gzip).
  PDF code remains deferred. The self-hosted font is 34 KB.

## Live deployment and checks

`/opt/fleet/lib/deploy-static.sh symptom-visit-brief /work/repo/dist` deployed
the final artifact to <https://symptom-visit-brief.sociobot.in>.

- All **29 public artifacts** SHA-256-match `dist/`. The 30th built file,
  `staticwebapp.config.json`, is intentionally host-private and returns HTTP
  404.
- Live `/` and `/demo` return the intended CSP, Permissions-Policy,
  `strict-origin-when-cross-origin` referrer policy, and `nosniff`.
- A fresh desktop and Pixel 5 context both showed the job-focused h1, audience,
  and **Try it with sample data** action before scrolling. The action loaded
  four realistic observations, the persistent demo label, reset control, and
  separate demo workspace. A temporary real observation did not appear in demo
  and returned after **Start for real**. No console errors or third-party
  requests occurred.
- In fresh live contexts, service-worker control completed, offline reload
  showed “Offline · still saving,” and all four samples remained visible.
- A real live client with `visit-brief-1.0.1` cache received
  `visit-brief-1.0.2` after deployment and displayed “A fresh version is
  ready. Refresh”. Evidence: `/work/.evidence/live-update-check.json`.
- The public license verification allowance was 30 HTTP 200 responses followed
  by one HTTP 429 with `Retry-After: 3` for a dummy license token.

## Run and deploy

```sh
npm ci
npm run check
npm run test:e2e
npm run build
```

Deploy `dist/`, including `dist/staticwebapp.config.json`, with the product
static deployment configuration. `scripts/preview-static.mjs` is the local
host-equivalent browser-test preview; unlike Vite preview, it hides the
deployment config as production does.

## Known limits

- Symptom records remain browser/device local and can be removed when site data
  is cleared. JSON backup is the portability path.
- No real purchase was made during verification. The live checkout route is
  registered; return/restore and verification behavior are browser-tested with
  a mocked valid license to avoid a charge.
