# Demo sandbox

Open [the demo](/demo) or `https://symptom-visit-brief.sociobot.in/demo` for a
one-click, isolated sample workspace. It starts with four realistic
observations: two dizziness notes, a headache, and sudden fatigue.

Demo records use the IndexedDB database `demo:symptom-visit-brief`. Real
records use `symptom-visit-brief`; neither workspace reads or writes the
other. Demo-only license state uses the `demo:sb_license:symptom-visit-brief`
local-storage key. The fixed banner says that it is demo mode and provides:

- **Reset demo**: removes only demo records and restores the four shipped samples.
- **Start for real**: removes only demo records, then opens the empty real workspace.

The demo works after the initial visit while offline because the service worker
precaches the app shell and the sample records are created locally.
