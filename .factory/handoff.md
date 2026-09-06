# Handoff — Symptom Visit Brief verification 3

**Current release decision: FAIL.** The reviewed implementation is
`2120af7ae8fd19c83413930764fae189994d610e`; the prior verification-document
pointer is `905048b345dac0d4f9f98b462c8c7dca33e9a1a0`. This verification made
no product-code change.

The live implementation and a fresh build match on all 29 public files. The
host-private `staticwebapp.config.json` correctly returns 404. `npm ci`,
`npm run check`, every one of the 13 exact claim commands, `npm run test:e2e`
(36/36), both dependency audits, and live desktop/phone offline reload passed.
The demo is isolated from real browser records and its normal, invalid,
boundary, recovery, accessibility, privacy, routing, legal-page, and header
checks passed.

One medium issue remains: live `/demo` canonicals to `/` while the sitemap
lists `/demo` as a public URL. Lighthouse 13.4.1 gives root 100/100/100/100 but
demo 100/100/100/92 and flags the demo canonical. Repair that route’s canonical
and matching Open Graph URL (or remove/noindex the demo consistently), deploy,
and re-run the demo Lighthouse and full claim suite.

Run locally:

```sh
npm ci
npm run check
npm run test:e2e
npm audit --omit=dev
npm audit
```

The complete independent report is `.factory/verification-3.md`. Required
external evidence is at `/work/.evidence/qa-report.md` and
`/work/.evidence/qa-result.json`.
