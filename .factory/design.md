# Visual thesis — Signal constellations

## Direction and rationale

Symptom Visit Brief uses **generative geometry** as a quiet form of evidence-making. Daily observations appear as plotted nodes, duration becomes a short line, and severity becomes a numbered ring. The visual language borrows from graph paper, field notebooks, and astronomical charts without implying clinical precision. It fits a product that helps a person notice a chronological story: discrete moments become an understandable constellation while the language stays factual and non-diagnostic.

The interface is a focused utility, not a dashboard. On wide screens it uses a split field: the check-in is the steady left rail and the chronological record has room on the right. At 390 px it becomes one clear column; decorative geometry recedes and actions stack.

## Palette

The palette comes from a paper visit note marked with mineral ink and small highlighter annotations.

| Token | Light | Dark | Purpose |
| --- | --- | --- | --- |
| Paper / background | `#F5F1E8` | `#171B1B` | Warm, low-glare writing field |
| Surface | `#FFFDF7` | `#222827` | Forms and independent records |
| Ink / text | `#182522` | `#F4F1E8` | Primary content, ≥ 12:1 on paper |
| Muted ink | `#53615D` | `#B8C3BF` | Supporting copy, ≥ 5.5:1 |
| Teal signal | `#006B63` | `#58D0C2` | Primary actions and focus |
| Teal deep | `#004B46` | `#A3EEE4` | Interactive emphasis |
| Vermilion | `#B7422E` | `#FF8D77` | High severity / destructive action |
| Saffron | `#986B00` | `#F1C75B` | Medium severity / caution |
| Moss | `#37734A` | `#80CE98` | Saved / low severity |
| Rule | `#D7D0C2` | `#3A4441` | Structure and chart grid |

Color never carries state alone: severity always includes its number and text label; offline and license states include text and icons.

## Type and numbers

- Headings: the local **Georgia / Charter serif stack**, with the practical authority of an annotated case note and zero font transfer.
- UI and body: **Atkinson Hyperlegible Next**, self-hosted variable sans, optimized for character distinction and sustained legibility.
- Atkinson Hyperlegible Next is shipped as a 34 KB Latin variable WOFF2 under the SIL Open Font License. No runtime font network requests.
- Scale: 16 px body, 18 px lead, 20 px section heading, 28 px card title, clamp 40–64 px h1. Body line height 1.55 and readable measure ≤ 68 characters.
- Dates, counts, and duration use tabular numerals. Sentence case throughout.

## Spacing and shape

- Base rhythm: 4 px; common gaps 8, 12, 16, 24, 32, 48, 64 px.
- Controls are at least 48 px high with an 8 px gap. Main container max-width is 1180 px.
- Corners are modest (8–18 px). Rings are reserved for plotted observations and severity—not generic decoration.
- Borders are ink-like 1 px rules. Shadows are shallow and tinted; hierarchy comes primarily from proximity and scale.

## Interaction grammar

- The primary path is explicit: **Record an observation → review the timeline → prepare a brief**.
- The severity control is a native range paired with large numbered buttons and a live text label; keyboard arrows work without custom scripting.
- Saving draws a new plotted node into the timeline and announces the result. Editing returns the record to its origin. Deletion names the record and requires confirmation.
- Filters update counts and export scope together so the exported brief always matches what the person sees.
- Empty, error, offline, and update states each name what happened and provide a next step.

## Motion policy

- 180–240 ms ease-out transitions for disclosure, saved-state emphasis, and toast arrival; only opacity and transform animate.
- New timeline nodes rise 6 px from their chronological position; dialogs fade and scale from their triggering action.
- No looping animation and no decorative parallax.
- Under `prefers-reduced-motion: reduce`, transitions and smooth scrolling become instant. The geometry remains fully legible as a static composition.

## Asset plan and provenance

### Generated hero / empty-state illustration

- Subject: an abstract constellation made from paper discs, transparent mineral-green rings, thin ink lines, one saffron marker, and a small folded timeline slip.
- World/materials: tactile archival paper, cut vellum, graphite, lightly embossed geometry.
- Light/lens: soft daylight from upper left, orthographic editorial still life, generous negative space.
- Palette words: warm bone paper, deep bottle ink, oxidized teal, muted saffron, restrained vermilion.
- Negative list: no people, anatomy, pills, medical crosses, screens, charts with labels, readable text, logos, watermark, gradients, neon, glossy stock 3D.
- Prompt: “A refined editorial still life for a private symptom observation utility: abstract generative geometry on warm bone archival paper, a chronological constellation of six tactile paper discs connected by fine deep bottle-green ink lines, transparent oxidized-teal vellum rings indicating intensity, one muted saffron square marker, one small vermilion dot, a folded narrow paper timeline slip; precise but handmade, calm daylight from upper left, subtle paper fibers and embossed shadows, orthographic wide composition, ample quiet negative space, no people, no anatomy, no medication, no medical crosses, no screens, no readable text, no logos, no watermark, no gradients, no neon.”
- Generation: Sociobot factory image deployment via `/opt/fleet/lib/gen-image.sh`, 1536×1024, high quality, 2026-08-28. Original generated work for this product; source PNG and prompt sidecar retained in `assets/src/`.
- Delivery: responsive WebP at 960 px and 560 px wide; mobile source ≤ 300 KB. The illustration is meaningful and receives descriptive alt text. Generated imagery is disclosed in the footer.

### Authored assets

- App icons: hand-authored SVG-derived “observation orbit” mark, exported locally to 192 px and 512 px PNG including a maskable-safe version.
- UI icons: simple inline SVG strokes authored for this product; no third-party icon library.

## Themes

Both paper-light and night-ink themes are first-class and follow the operating system. All tokens change together; no transparent default canvas is left to the browser. Print output is always paper-light for predictable clinician-facing export.
