import './styles.css';
import type { AppSettings, DateFilter, Observation } from './types';
import {
  escapeHtml,
  filterObservations,
  formatDateTime,
  formatDuration,
  localDate,
  localTime,
  severityLabel,
  summarize,
  toCsv,
  trendSentence
} from './domain';
import {
  clearCurrentStorage,
  demoMode,
  getSettings,
  listObservations,
  mergeImport,
  removeObservation,
  saveObservation,
  saveSettings
} from './db';
import {
  acceptLicenseFromUrl,
  cachedUnlock,
  checkoutUrl,
  storeLicense,
  verifyLicense
} from './license';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('The application root is missing.');

let observations: Observation[] = [];
let settings: AppSettings = { key: 'app', presets: [], displayName: '', briefTitle: '' };
let editingId = '';
let paid = cachedUnlock();
let filter: DateFilter = { from: '', to: '', query: '' };

const sampleObservations: Observation[] = [
  {
    id: 'demo-dizziness-1',
    occurredAt: '2026-08-24T08:10:00.000Z',
    symptom: 'Dizziness after standing',
    severity: 6,
    durationMinutes: 8,
    context: 'Stood up after working at the kitchen table. Had eaten breakfast and one glass of water.',
    createdAt: '2026-08-24T08:20:00.000Z',
    updatedAt: '2026-08-24T08:20:00.000Z'
  },
  {
    id: 'demo-dizziness-2',
    occurredAt: '2026-08-25T17:35:00.000Z',
    symptom: 'Dizziness after bus ride',
    severity: 4,
    durationMinutes: 12,
    context: 'Started when I stepped off the bus. I had walked for ten minutes before boarding.',
    createdAt: '2026-08-25T17:50:00.000Z',
    updatedAt: '2026-08-25T17:50:00.000Z'
  },
  {
    id: 'demo-headache-1',
    occurredAt: '2026-08-26T13:15:00.000Z',
    symptom: 'Headache behind left eye',
    severity: 7,
    durationMinutes: 95,
    context: 'Began after lunch during a bright video call. Improved after resting in a dim room.',
    createdAt: '2026-08-26T15:00:00.000Z',
    updatedAt: '2026-08-26T15:00:00.000Z'
  },
  {
    id: 'demo-fatigue-1',
    occurredAt: '2026-08-27T18:40:00.000Z',
    symptom: 'Sudden fatigue',
    severity: 5,
    durationMinutes: 70,
    context: 'Needed to sit down while making dinner. Slept seven hours the night before.',
    createdAt: '2026-08-27T20:00:00.000Z',
    updatedAt: '2026-08-27T20:00:00.000Z'
  }
];

const icon = (name: 'plus' | 'timeline' | 'brief' | 'lock' | 'download' | 'photo'): string => {
  const paths = {
    plus: '<path d="M12 5v14M5 12h14"/>',
    timeline: '<path d="M5 4v16M5 7h5M5 12h10M5 17h7"/><circle cx="5" cy="7" r="1"/><circle cx="5" cy="12" r="1"/><circle cx="5" cy="17" r="1"/>',
    brief: '<path d="M6 3h9l3 3v15H6zM9 11h6M9 15h6M9 7h3"/>',
    lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    download: '<path d="M12 3v12m-4-4 4 4 4-4M5 20h14"/>',
    photo: '<rect x="3" y="5" width="18" height="15" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m4 17 5-4 3 3 3-2 5 4"/>'
  };
  return `<svg aria-hidden="true" viewBox="0 0 24 24">${paths[name]}</svg>`;
};

const renderShell = (): void => {
  app.innerHTML = `
    ${demoMode ? `<aside class="demo-banner" aria-label="Demo mode"><strong>Demo — sample data, nothing is saved to your records</strong><span>Explore four realistic observations in a separate workspace.</span><div><button type="button" id="reset-demo">Reset demo</button><button type="button" id="start-real">Start for real</button></div></aside>` : ''}
    <header class="site-header">
      <div class="header-inner">
        <a class="wordmark" href="/" aria-label="Symptom Visit Brief home">
          <span class="mark" aria-hidden="true"><i></i></span>
          <span>Symptom Visit Brief</span>
        </a>
        <nav aria-label="Main navigation">
          <a href="/demo">Demo</a>
          <a href="#check-in">Check-in</a>
          <a href="#timeline">Timeline</a>
          <a href="/privacy/">Privacy</a>
        </nav>
        <span class="network-state" id="network-state"><i></i><span>On device</span></span>
      </div>
    </header>
    <main id="main">
      <section class="hero" aria-labelledby="page-title">
        <div class="hero-copy">
          <p class="eyebrow">A factual memory aid for appointments</p>
          <h1 id="page-title">Turn symptom notes into a visit brief</h1>
          <p class="lede">For people with intermittent symptoms who need a factual timeline for a clinician visit.</p>
          <div class="hero-actions">
            <a class="button primary" href="/demo">Try it with sample data</a>
            <a class="text-link" href="#check-in">Record your first observation <span aria-hidden="true">→</span></a>
          </div>
          <p class="action-note">The demo loads four sample observations in a separate workspace.</p>
          <ul class="plain-facts"><li>Works offline after your first visit.</li><li>Records stay in this browser unless you export them.</li><li>Core features are free. Brief Plus costs $9 once.</li></ul>
        </div>
        <picture class="hero-art">
          <source media="(max-width: 640px)" srcset="/assets/signal-constellation-720.webp" />
          <img src="/assets/signal-constellation-960.webp" width="960" height="640" fetchpriority="high" alt="Tactile paper circles joined into a chronological constellation, with rings showing changing intensity." />
        </picture>
      </section>

      <div class="workspace">
        <section class="checkin-panel" id="check-in" aria-labelledby="checkin-title">
          <div class="section-heading">
            <p class="step">01 · Capture</p>
            <h2 id="checkin-title">What did you notice?</h2>
            <p>Use your own words. Required fields are marked <span aria-hidden="true">*</span><span class="sr-only">required</span>.</p>
          </div>
          <form id="observation-form" novalidate>
            <div class="form-row two-up">
              <label>Date <span aria-hidden="true">*</span><input id="date" name="date" type="date" required /></label>
              <label>Time <span aria-hidden="true">*</span><input id="time" name="time" type="time" required /></label>
            </div>
            <label>Symptom or change <span aria-hidden="true">*</span>
              <input id="symptom" name="symptom" type="text" maxlength="100" autocomplete="off" required aria-describedby="symptom-help" />
              <span class="field-help" id="symptom-help">For example: cramping, dizziness, rash, or fatigue.</span>
            </label>
            <div id="preset-row" class="preset-row" role="group" aria-label="Saved symptom presets"></div>
            <fieldset class="severity-field">
              <legend>Severity <span aria-hidden="true">*</span></legend>
              <div class="severity-readout"><output id="severity-output" for="severity">5</output><span><strong id="severity-label">Moderate</strong><small>out of 10</small></span></div>
              <label class="range-control-label" for="severity">Adjust severity from 1 to 10</label>
              <input id="severity" name="severity" type="range" min="1" max="10" value="5" step="1" aria-describedby="severity-scale" />
              <div id="severity-scale" class="range-labels"><span>1 · Mild</span><span>5 · Moderate</span><span>10 · High</span></div>
            </fieldset>
            <div class="form-row duration-row">
              <label>Duration <span aria-hidden="true">*</span><input id="duration" name="duration" type="number" min="1" max="10080" value="30" inputmode="numeric" required /></label>
              <label>Unit <select id="duration-unit" name="durationUnit"><option value="1">minutes</option><option value="60">hours</option></select></label>
            </div>
            <label>Trigger or context <span class="optional">Optional</span>
              <textarea id="context" name="context" rows="3" maxlength="500" aria-describedby="context-help"></textarea>
              <span class="field-help" id="context-help">What you were doing, eating, or experiencing—facts only.</span>
            </label>
            <label class="photo-control">${icon('photo')} <span><strong>Add a photo</strong><small>Optional · stored only on this device</small></span><input id="photo" name="photo" type="file" accept="image/*" /></label>
            <div id="photo-preview" class="photo-preview"></div>
            <p class="form-error" id="form-error" role="alert"></p>
            <div class="form-actions">
              <button class="button primary" type="submit" id="save-button">Save observation</button>
              <button class="button quiet hidden" type="button" id="cancel-edit">Cancel edit</button>
            </div>
          </form>
          <aside class="safety-note"><strong>This is a memory aid, not medical advice.</strong> It does not diagnose or recommend treatment. For urgent or severe symptoms, contact local emergency services.</aside>
        </section>

        <section class="timeline-panel" id="timeline" aria-labelledby="timeline-title">
          <div class="section-heading timeline-heading">
            <div><p class="step">02 · Review</p><h2 id="timeline-title">Your timeline</h2></div>
            <span class="record-count" id="record-count">0 observations</span>
          </div>
          <div class="filter-bar" aria-label="Filter timeline and brief">
            <label>From<input type="date" id="filter-from" /></label>
            <label>To<input type="date" id="filter-to" /></label>
            <label class="search-label">Search<input type="search" id="filter-query" placeholder="Symptom or context" /></label>
            <button class="button quiet compact" id="clear-filters" type="button">Clear</button>
          </div>
          <div id="summary" class="summary-strip" aria-live="polite"></div>
          <div id="timeline-list" class="timeline-list"></div>
        </section>
      </div>

      <section class="brief-section" id="brief" aria-labelledby="brief-title">
        <div class="brief-intro">
          <p class="step">03 · Prepare</p>
          <h2 id="brief-title">Prepare a visit brief</h2>
          <p>Your current date and search filters define this brief. The one-page PDF keeps the scan concise; CSV keeps every matching detail.</p>
        </div>
        <div class="brief-preview" id="brief-preview"></div>
        <div class="export-actions">
          <button class="button primary" id="export-pdf" type="button">${icon('download')} Export one-page PDF</button>
          <button class="button secondary" id="export-csv" type="button">Export CSV</button>
        </div>
        <p class="export-help">Exports are created on this device. Share them only with people you choose.</p>
      </section>

      <section class="ownership-section" aria-labelledby="ownership-title">
          <div><p class="step">Your data</p><h2 id="ownership-title">Export and merge a backup</h2><p>Export a complete JSON backup or merge one back into this browser. Newer edits win; existing history is not erased.</p></div>
        <div class="ownership-actions">
          <button class="button secondary" id="export-json" type="button">Export backup</button>
          <label class="button quiet file-button">Import backup<input id="import-json" type="file" accept="application/json,.json" /></label>
        </div>
      </section>

      <section class="plus-section" aria-labelledby="plus-title">
        <div class="plus-mark">${icon('lock')}</div>
        <div class="plus-copy"><p class="step">One-time unlock</p><h2 id="plus-title">Brief Plus</h2><p>Save reusable symptom presets and personalize the heading on your visit brief. The diary and every export remain free.</p><p><strong>$9 once.</strong> One-time purchase.</p></div>
        <div id="license-panel" class="license-panel"></div>
      </section>
    </main>
    <footer>
      <div><span class="wordmark footer-mark"><span class="mark" aria-hidden="true"><i></i></span><span>Symptom Visit Brief</span></span><p>Private symptom notes for clinician visits.</p></div>
      <nav aria-label="Legal and product links"><a href="/privacy/">Privacy</a><a href="/terms/">Terms</a><a href="https://github.com/B-Divyesh/sf-symptom-visit-brief" rel="noreferrer">Source</a></nav>
      <p class="provenance">The paper constellation illustration was generated for this product with the Sociobot factory image model. <span>Version 1.0.1 · Built by Param Factory.</span></p>
    </footer>
    <div class="toast" id="toast" role="status" aria-live="polite"></div>
  `;
};

const byId = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id) as T | null;
  if (!element) throw new Error(`Missing element: ${id}`);
  return element;
};

const showToast = (message: string, action?: { label: string; run: () => void }): void => {
  const toast = byId<HTMLDivElement>('toast');
  toast.replaceChildren(document.createTextNode(message));
  if (action) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = action.label;
    button.addEventListener('click', action.run, { once: true });
    toast.append(button);
  }
  toast.classList.add('visible');
  window.setTimeout(() => toast.classList.remove('visible'), 6000);
};

const setNetworkState = (): void => {
  const state = byId<HTMLSpanElement>('network-state');
  state.classList.toggle('offline', !navigator.onLine);
  state.querySelector('span')!.textContent = navigator.onLine ? 'On device' : 'Offline · still saving';
};

const severityClass = (severity: number): string => severity <= 3 ? 'low' : severity <= 6 ? 'medium' : 'high';

const renderPresets = (): void => {
  const row = byId<HTMLDivElement>('preset-row');
  if (!paid || !settings.presets.length) {
    row.innerHTML = '';
    return;
  }
  row.innerHTML = settings.presets.map((preset) => `<button type="button" class="preset" data-preset="${escapeHtml(preset)}">${escapeHtml(preset)}</button>`).join('');
  row.querySelectorAll<HTMLButtonElement>('[data-preset]').forEach((button) => {
    button.addEventListener('click', () => {
      byId<HTMLInputElement>('symptom').value = button.dataset.preset || '';
      byId<HTMLInputElement>('symptom').focus();
    });
  });
};

const renderTimeline = (): void => {
  const entries = filterObservations(observations, filter);
  const summary = summarize(entries);
  byId<HTMLSpanElement>('record-count').textContent = `${entries.length} ${entries.length === 1 ? 'observation' : 'observations'}`;
  byId<HTMLDivElement>('summary').innerHTML = entries.length ? `
    <div><strong>${summary.averageSeverity}</strong><span>Average severity</span></div>
    <div><strong>${summary.days}</strong><span>${summary.days === 1 ? 'Day' : 'Days'} observed</span></div>
    <div><strong>${formatDuration(summary.totalDuration)}</strong><span>Total duration</span></div>
    <p>${escapeHtml(trendSentence(summary))}</p>` : '';

  const list = byId<HTMLDivElement>('timeline-list');
  if (!observations.length) {
    list.innerHTML = `<div class="empty-state"><span class="empty-orbit" aria-hidden="true"><i></i></span><h3>Your saved observations appear here.</h3><p>Record one observation while the details are still fresh. It will appear here, ready for your brief.</p><a class="button primary" href="#check-in">Record the first observation</a></div>`;
  } else if (!entries.length) {
    list.innerHTML = `<div class="empty-state filtered"><h3>No observations match.</h3><p>Try a wider date range or clear the search. Your saved records have not changed.</p><button class="button secondary" type="button" id="empty-clear">Clear filters</button></div>`;
    byId<HTMLButtonElement>('empty-clear').addEventListener('click', clearFilters);
  } else {
    list.innerHTML = `<ol>${entries.map((entry) => `
      <li class="timeline-entry">
        <div class="severity-node ${severityClass(entry.severity)}" aria-label="Severity ${entry.severity} out of 10, ${severityLabel(entry.severity)}"><span>${entry.severity}</span></div>
        <article>
          <div class="entry-top"><div><time datetime="${entry.occurredAt}">${escapeHtml(formatDateTime(entry.occurredAt))}</time><h3>${escapeHtml(entry.symptom)}</h3></div><span class="duration">${escapeHtml(formatDuration(entry.durationMinutes))}</span></div>
          ${entry.context ? `<p>${escapeHtml(entry.context)}</p>` : '<p class="muted">No context added.</p>'}
          ${entry.photoDataUrl ? `<button type="button" class="photo-thumb" data-photo="${entry.id}" aria-label="View photo for ${escapeHtml(entry.symptom)}"><img src="${entry.photoDataUrl}" alt="Photo attached to ${escapeHtml(entry.symptom)} observation" /></button>` : ''}
          <div class="entry-actions"><button type="button" data-edit="${entry.id}">Edit</button><button type="button" class="danger-link" data-delete="${entry.id}">Delete</button></div>
        </article>
      </li>`).join('')}</ol>`;
    list.querySelectorAll<HTMLButtonElement>('[data-edit]').forEach((button) => button.addEventListener('click', () => startEdit(button.dataset.edit || '')));
    list.querySelectorAll<HTMLButtonElement>('[data-delete]').forEach((button) => button.addEventListener('click', () => deleteEntry(button.dataset.delete || '')));
    list.querySelectorAll<HTMLButtonElement>('[data-photo]').forEach((button) => button.addEventListener('click', () => openPhoto(button.dataset.photo || '')));
  }
  renderBrief(entries);
};

const renderBrief = (entries: Observation[]): void => {
  const summary = summarize(entries);
  const preview = byId<HTMLDivElement>('brief-preview');
  preview.innerHTML = `
    <div class="brief-paper">
      <div class="brief-paper-head"><div><small>${escapeHtml(settings.displayName || 'Private observation record')}</small><h3>${escapeHtml(settings.briefTitle || 'Symptom visit brief')}</h3></div><span>${filter.from || 'First record'}<br>— ${filter.to || 'Most recent'}</span></div>
      <div class="brief-metrics"><div><strong>${summary.count || '—'}</strong><span>observations</span></div><div><strong>${summary.averageSeverity || '—'}</strong><span>average / 10</span></div><div><strong>${summary.days || '—'}</strong><span>days</span></div></div>
      <p>${entries.length ? escapeHtml(trendSentence(summary)) : 'Your matching observations will be summarized here.'}</p>
      <div class="brief-lines" aria-hidden="true"><i></i><i></i><i></i></div>
    </div>`;
  byId<HTMLButtonElement>('export-pdf').disabled = !entries.length;
  byId<HTMLButtonElement>('export-csv').disabled = !entries.length;
};

const renderLicense = (notice = ''): void => {
  const panel = byId<HTMLDivElement>('license-panel');
  if (paid) {
    panel.innerHTML = `
      <p class="unlocked"><span aria-hidden="true">✓</span> Brief Plus is unlocked on this device.</p>
      <form id="plus-settings">
        <label>Name on brief <span class="optional">Optional</span><input name="displayName" maxlength="60" value="${escapeHtml(settings.displayName)}" /></label>
        <label>Brief heading <span class="optional">Optional</span><input name="briefTitle" maxlength="80" value="${escapeHtml(settings.briefTitle)}" placeholder="Symptom visit brief" /></label>
        <label>Saved symptoms <span class="optional">Comma-separated</span><input name="presets" maxlength="240" value="${escapeHtml(settings.presets.join(', '))}" placeholder="Headache, nausea, fatigue" /></label>
        <button class="button secondary" type="submit">Save Plus settings</button>
      </form>`;
    byId<HTMLFormElement>('plus-settings').addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget as HTMLFormElement);
      settings = {
        key: 'app',
        displayName: String(data.get('displayName') || '').trim(),
        briefTitle: String(data.get('briefTitle') || '').trim(),
        presets: [...new Set(String(data.get('presets') || '').split(',').map((item) => item.trim()).filter(Boolean))].slice(0, 8)
      };
      await saveSettings(settings);
      renderPresets();
      renderTimeline();
      showToast('Brief Plus settings saved.');
    });
  } else {
    panel.innerHTML = `
      ${notice ? `<p class="license-notice" role="status">${escapeHtml(notice)}</p>` : ''}
      <a class="button plus-button" href="${checkoutUrl}">Unlock Brief Plus · $9</a>
      <details><summary>Already purchased?</summary><form id="restore-form"><label>License token<input name="license" autocomplete="off" required /></label><button class="button secondary" type="submit" aria-label="Verify license">Verify license</button><p class="field-help">Your token is stored only in this browser.</p></form></details>
      <p class="merchant-note">One-time purchase. Sociobot / Dodo is the merchant of record; refunds are handled there. <a href="/terms/">Terms</a></p>`;
    byId<HTMLFormElement>('restore-form').addEventListener('submit', async (event) => {
      event.preventDefault();
      const token = String(new FormData(event.currentTarget as HTMLFormElement).get('license') || '');
      if (!token.trim()) return;
      storeLicense(token);
      try {
        paid = await verifyLicense(true);
        renderLicense(paid ? '' : 'That license is not active for this product.');
        renderPresets();
        if (paid) showToast('Brief Plus unlocked.');
      } catch {
        renderLicense('Could not verify while offline. Try again when connected.');
      }
    });
  }
};

const clearFilters = (): void => {
  filter = { from: '', to: '', query: '' };
  byId<HTMLInputElement>('filter-from').value = '';
  byId<HTMLInputElement>('filter-to').value = '';
  byId<HTMLInputElement>('filter-query').value = '';
  renderTimeline();
};

const resetForm = (): void => {
  const form = byId<HTMLFormElement>('observation-form');
  form.reset();
  byId<HTMLInputElement>('date').value = localDate();
  byId<HTMLInputElement>('time').value = localTime();
  byId<HTMLInputElement>('severity').value = '5';
  byId<HTMLOutputElement>('severity-output').value = '5';
  byId<HTMLElement>('severity-label').textContent = 'Moderate';
  byId<HTMLInputElement>('duration').value = '30';
  byId<HTMLDivElement>('photo-preview').innerHTML = '';
  editingId = '';
  byId<HTMLButtonElement>('save-button').textContent = 'Save observation';
  byId<HTMLButtonElement>('cancel-edit').classList.add('hidden');
  byId<HTMLParagraphElement>('form-error').textContent = '';
};

const startEdit = (id: string): void => {
  const entry = observations.find((item) => item.id === id);
  if (!entry) return;
  editingId = id;
  const date = new Date(entry.occurredAt);
  byId<HTMLInputElement>('date').value = localDate(date);
  byId<HTMLInputElement>('time').value = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  byId<HTMLInputElement>('symptom').value = entry.symptom;
  byId<HTMLInputElement>('severity').value = String(entry.severity);
  byId<HTMLOutputElement>('severity-output').value = String(entry.severity);
  byId<HTMLElement>('severity-label').textContent = severityLabel(entry.severity);
  byId<HTMLInputElement>('duration').value = String(entry.durationMinutes);
  byId<HTMLSelectElement>('duration-unit').value = '1';
  byId<HTMLTextAreaElement>('context').value = entry.context;
  byId<HTMLButtonElement>('save-button').textContent = 'Save changes';
  byId<HTMLButtonElement>('cancel-edit').classList.remove('hidden');
  if (entry.photoDataUrl) byId<HTMLDivElement>('photo-preview').innerHTML = `<img src="${entry.photoDataUrl}" alt="Current attached photo" /><span>Current photo</span>`;
  document.querySelector('#check-in')?.scrollIntoView({ behavior: 'smooth' });
  byId<HTMLInputElement>('symptom').focus({ preventScroll: true });
};

const deleteEntry = async (id: string): Promise<void> => {
  const entry = observations.find((item) => item.id === id);
  if (!entry || !window.confirm(`Delete the ${entry.symptom} observation from ${formatDateTime(entry.occurredAt)}? This cannot be undone.`)) return;
  await removeObservation(id);
  observations = observations.filter((item) => item.id !== id);
  renderTimeline();
  showToast('Observation deleted.');
};

const openPhoto = (id: string): void => {
  const entry = observations.find((item) => item.id === id);
  if (!entry?.photoDataUrl) return;
  const dialog = document.createElement('dialog');
  dialog.className = 'photo-dialog';
  dialog.innerHTML = `<div><button type="button" aria-label="Close photo">×</button><img src="${entry.photoDataUrl}" alt="Photo attached to ${escapeHtml(entry.symptom)} observation" /><p>${escapeHtml(entry.symptom)} · ${escapeHtml(formatDateTime(entry.occurredAt))}</p></div>`;
  document.body.append(dialog);
  const close = () => { dialog.close(); dialog.remove(); };
  dialog.querySelector('button')!.addEventListener('click', close);
  dialog.addEventListener('cancel', close);
  dialog.addEventListener('click', (event) => { if (event.target === dialog) close(); });
  dialog.showModal();
  dialog.querySelector('button')!.focus();
};

const imageToDataUrl = async (file: File): Promise<string> => {
  if (file.size > 12_000_000) throw new Error('Choose a photo smaller than 12 MB.');
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', 0.82);
};

const download = (content: BlobPart, type: string, filename: string): void => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const bindEvents = (): void => {
  window.addEventListener('online', setNetworkState);
  window.addEventListener('offline', setNetworkState);
  const severity = byId<HTMLInputElement>('severity');
  severity.addEventListener('input', () => {
    const value = Number(severity.value);
    byId<HTMLOutputElement>('severity-output').value = String(value);
    byId<HTMLElement>('severity-label').textContent = severityLabel(value);
  });
  byId<HTMLInputElement>('photo').addEventListener('change', async (event) => {
    const file = ((event.currentTarget as HTMLInputElement).files || [])[0];
    if (!file) return;
    try {
      const data = await imageToDataUrl(file);
      byId<HTMLDivElement>('photo-preview').innerHTML = `<img src="${data}" alt="Selected photo preview" /><span>${escapeHtml(file.name)}</span>`;
    } catch (error) {
      byId<HTMLParagraphElement>('form-error').textContent = error instanceof Error ? error.message : 'The photo could not be read.';
    }
  });
  byId<HTMLButtonElement>('cancel-edit').addEventListener('click', resetForm);
  byId<HTMLFormElement>('observation-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const form = event.currentTarget as HTMLFormElement;
    const error = byId<HTMLParagraphElement>('form-error');
    error.textContent = '';
    if (!form.reportValidity()) return;
    const data = new FormData(form);
    const symptom = String(data.get('symptom') || '').trim();
    const duration = Number(data.get('duration')) * Number(data.get('durationUnit'));
    const occurred = new Date(`${data.get('date')}T${data.get('time')}`);
    if (!symptom || !Number.isFinite(duration) || duration < 1 || Number.isNaN(occurred.getTime())) {
      error.textContent = 'Check the symptom, date, time, and duration, then try again.';
      return;
    }
    const existing = observations.find((entry) => entry.id === editingId);
    const photoFile = (byId<HTMLInputElement>('photo').files || [])[0];
    try {
      const now = new Date().toISOString();
      const entry: Observation = {
        id: existing?.id || crypto.randomUUID(),
        occurredAt: occurred.toISOString(),
        symptom,
        severity: Number(data.get('severity')),
        durationMinutes: Math.round(duration),
        context: String(data.get('context') || '').trim(),
        photoDataUrl: photoFile ? await imageToDataUrl(photoFile) : existing?.photoDataUrl,
        photoName: photoFile?.name || existing?.photoName,
        createdAt: existing?.createdAt || now,
        updatedAt: now
      };
      await saveObservation(entry);
      const index = observations.findIndex((item) => item.id === entry.id);
      if (index >= 0) observations[index] = entry; else observations.push(entry);
      resetForm();
      renderTimeline();
      showToast(existing ? 'Changes saved.' : 'Observation saved on this device.');
    } catch (saveError) {
      error.textContent = saveError instanceof Error ? saveError.message : 'The observation could not be saved.';
    }
  });

  (['filter-from', 'filter-to', 'filter-query'] as const).forEach((id) => {
    byId<HTMLInputElement>(id).addEventListener('input', () => {
      filter = {
        from: byId<HTMLInputElement>('filter-from').value,
        to: byId<HTMLInputElement>('filter-to').value,
        query: byId<HTMLInputElement>('filter-query').value
      };
      renderTimeline();
    });
  });
  byId<HTMLButtonElement>('clear-filters').addEventListener('click', clearFilters);
  if (demoMode) {
    byId<HTMLButtonElement>('reset-demo').addEventListener('click', async () => {
      await clearCurrentStorage();
      await Promise.all(sampleObservations.map((entry) => saveObservation(entry)));
      observations = await listObservations();
      settings = await getSettings();
      filter = { from: '', to: '', query: '' };
      resetForm();
      clearFilters();
      renderPresets();
      showToast('Demo reset to four sample observations.');
    });
    byId<HTMLButtonElement>('start-real').addEventListener('click', async () => {
      await clearCurrentStorage();
      window.location.assign('/');
    });
  }
  byId<HTMLButtonElement>('export-csv').addEventListener('click', () => {
    const entries = filterObservations(observations, filter);
    download(`\ufeff${toCsv(entries)}`, 'text/csv;charset=utf-8', `symptom-visit-brief-${filter.from || 'all'}.csv`);
    showToast('CSV exported.');
  });
  byId<HTMLButtonElement>('export-pdf').addEventListener('click', async () => {
    const button = byId<HTMLButtonElement>('export-pdf');
    button.disabled = true;
    button.textContent = 'Preparing PDF…';
    try {
      const entries = filterObservations(observations, filter);
      const { exportPdf } = await import('./export');
      await exportPdf({ entries, summary: summarize(entries), from: filter.from, to: filter.to, displayName: paid ? settings.displayName : '', briefTitle: paid ? settings.briefTitle : '' });
      showToast('One-page PDF exported.');
    } catch {
      showToast('The PDF could not be prepared. Try the CSV export instead.');
    } finally {
      button.textContent = 'Export one-page PDF';
      button.disabled = !filterObservations(observations, filter).length;
    }
  });
  byId<HTMLButtonElement>('export-json').addEventListener('click', () => {
    download(JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), observations }, null, 2), 'application/json', `symptom-visit-brief-backup-${localDate()}.json`);
    showToast('Private backup exported.');
  });
  byId<HTMLInputElement>('import-json').addEventListener('change', async (event) => {
    const input = event.currentTarget as HTMLInputElement;
    const file = (input.files || [])[0];
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as { version: number; observations: Observation[] };
      if (parsed.version !== 1 || !Array.isArray(parsed.observations) || parsed.observations.some((entry) => !entry.id || !entry.occurredAt || !entry.symptom || !entry.updatedAt)) throw new Error();
      const result = await mergeImport(parsed.observations);
      observations = await listObservations();
      renderTimeline();
      showToast(`Backup merged: ${result.added} added, ${result.updated} updated.`);
    } catch {
      showToast('That file is not a valid Symptom Visit Brief backup.');
    } finally {
      input.value = '';
    }
  });
};

const registerServiceWorker = async (): Promise<void> => {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;
  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data?.type === 'UPDATE_READY') showToast('A fresh version is ready.', { label: 'Refresh', run: () => location.reload() });
    });
    if (registration.waiting) showToast('A fresh version is ready.', { label: 'Refresh', run: () => location.reload() });
  } catch {
    showToast('Offline installation is unavailable, but your local records still work.');
  }
};

const init = async (): Promise<void> => {
  if (demoMode) {
    document.title = 'Demo — Symptom Visit Brief';
    document.body.classList.add('demo-mode');
  }
  renderShell();
  bindEvents();
  resetForm();
  setNetworkState();
  acceptLicenseFromUrl();
  paid = cachedUnlock();
  try {
    if (demoMode && !(await listObservations()).length) {
      await Promise.all(sampleObservations.map((entry) => saveObservation(entry)));
    }
    [observations, settings] = await Promise.all([listObservations(), getSettings()]);
    renderPresets();
    renderTimeline();
  } catch (error) {
    byId<HTMLDivElement>('timeline-list').innerHTML = `<div class="error-state"><h3>Your on-device records could not be opened.</h3><p>${escapeHtml(error instanceof Error ? error.message : 'Reload the page and try again.')}</p><button class="button secondary" id="reload-app" type="button">Reload app</button></div>`;
    byId<HTMLButtonElement>('reload-app').addEventListener('click', () => location.reload());
  }
  renderLicense();
  if (localStorage.getItem(`${demoMode ? 'demo:' : ''}sb_license:symptom-visit-brief`)) {
    verifyLicense().then((valid) => {
      if (valid !== paid) { paid = valid; renderLicense(valid ? '' : 'License no longer active.'); renderPresets(); renderTimeline(); }
    }).catch(() => { /* Keep the cached experience while offline. */ });
  }
  await registerServiceWorker();
};

void init();
