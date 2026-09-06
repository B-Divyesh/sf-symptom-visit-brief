# Symptom Visit Brief

Symptom Visit Brief helps people with intermittent symptoms turn observations into a factual timeline for a clinician visit. It is a memory aid, not medical advice or a diagnostic device.

Live product: <https://symptom-visit-brief.sociobot.in>

## What it does

- Records date/time, symptom, severity, duration, context, and an optional photo.
- Filters a chronological timeline by dates or text.
- Exports CSV, a one-page PDF, and a JSON backup.
- Imports a backup without erasing existing history; newer edits replace older copies.
- Works offline after the first visit.
- Records stay in this browser unless you export them.
- Core features are free. Brief Plus costs $9 once.
- Brief Plus saves symptom presets and a personalized brief heading.

This is a memory aid, not medical advice or a diagnostic device.

## Develop and verify

Requires Node.js 20 or newer.

```sh
npm ci
npm run dev
npm test          # unit tests
npm run test:e2e  # production build + Playwright, axe, persistence, export, offline
npm run check     # TypeScript + unit tests + production build
```

Run each visitor-facing claim from the isolated sample workspace with the exact
commands in [`.factory/claims.json`](.factory/claims.json). Open `/demo` (or
`?demo=1`) for four shipped sample observations; it uses a separate IndexedDB
namespace and never reads or writes real records. See [`.factory/demo.md`](.factory/demo.md).

The exact deploy build command is `npm run build`. It writes the static app and generated service worker to `dist/`, with `dist/index.html` at the root and standalone `/privacy/` and `/terms/` pages.

To exercise billing against staging, set `VITE_BILLING_API_BASE=https://pilot-api.sociobot.in/api/v1` at build time. Production defaults to `https://api.sociobot.in/api/v1`; only the product slug is used, never a provider or product ID.

## Privacy and design

Records remain in this browser unless the user exports them. There are no
analytics, ads, runtime CDNs, or third-party scripts. The self-hosted Atkinson
Hyperlegible Next font is licensed under the SIL Open Font License; the
generated paper-constellation illustration is original and its
prompt/provenance are in [`assets/src`](assets/src).

See [`.factory/brief.json`](.factory/brief.json) for scope and [`.factory/design.md`](.factory/design.md) for the complete visual system and asset provenance. The repository is MIT licensed.
