# Symptom Visit Brief

Symptom Visit Brief is a private, offline-first symptom diary that turns quick observations into a concise, date-bounded clinician visit brief. It is for people with intermittent or difficult-to-explain symptoms who need a trustworthy timeline without a health account, diagnosis engine, or large dashboard.

Live product: <https://symptom-visit-brief.sociobot.in>

## What it does

- Records date/time, symptom, severity, duration, context, and an optional locally compressed photo.
- Filters a chronological timeline by dates or text and calculates plain counts and a first-half/second-half severity comparison.
- Exports a one-page PDF, complete CSV, and full JSON backup. JSON imports merge by record ID and keep the newest edit.
- Stores records in IndexedDB and precaches the complete app for offline use.
- Keeps all core tracking and exports free. A $9 one-time Brief Plus license adds reusable symptom presets and personalized brief headings via the Sociobot billing API.

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

The exact deploy build command is `npm run build`. It writes the static app and generated service worker to `dist/`, with `dist/index.html` at the root and standalone `/privacy/` and `/terms/` pages.

To exercise billing against staging, set `VITE_BILLING_API_BASE=https://pilot-api.sociobot.in/api/v1` at build time. Production defaults to `https://api.sociobot.in/api/v1`; only the product slug is used, never a provider or product ID.

## Privacy and design

Records and images remain on the device unless the user explicitly exports them. There are no analytics, ads, runtime CDNs, or third-party scripts. The self-hosted Atkinson Hyperlegible Next font is licensed under the SIL Open Font License; the generated paper-constellation illustration is original and its prompt/provenance are in [`assets/src`](assets/src).

See [`.factory/brief.json`](.factory/brief.json) for scope and [`.factory/design.md`](.factory/design.md) for the complete visual system and asset provenance. The repository is MIT licensed.
