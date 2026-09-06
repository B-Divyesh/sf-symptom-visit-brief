import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';

const sampleSymptoms = [
  'Dizziness after standing',
  'Dizziness after bus ride',
  'Headache behind left eye',
  'Sudden fatigue'
];

const saveObservation = async (page: import('@playwright/test').Page, symptom: string): Promise<void> => {
  await page.locator('#symptom').fill(symptom);
  await page.locator('#severity').fill('7');
  await page.locator('#duration').fill('20');
  await page.locator('#context').fill('After standing from desk');
  await page.getByRole('button', { name: 'Save observation' }).click();
  await expect(page.getByText('Observation saved on this device.')).toBeVisible();
};

test('@claim:demo-sandbox puts sample data in a separate workspace and returns to real records', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Turn symptom notes into a visit brief' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Try it with sample data' })).toBeVisible();
  await saveObservation(page, 'Real namespace observation');

  await page.getByRole('link', { name: 'Try it with sample data' }).click();
  await expect(page).toHaveURL(/\/demo$/);
  await expect(page.getByLabel('Demo mode')).toContainText('Demo — sample data, nothing is saved to your records');
  await expect(page.getByText('4 observations')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Real namespace observation' })).toHaveCount(0);
  for (const symptom of sampleSymptoms) await expect(page.getByRole('heading', { name: symptom })).toBeVisible();

  await saveObservation(page, 'Demo-only observation');
  await expect(page.getByText('5 observations')).toBeVisible();
  await page.getByRole('button', { name: 'Start for real' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('heading', { name: 'Real namespace observation' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Demo-only observation' })).toHaveCount(0);
});

test('@claim:offline-reload works offline after the first demo visit', async ({ page, context }) => {
  await page.goto('/demo');
  await expect(page.getByText('4 observations')).toBeVisible();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await expect(page.getByText('4 observations')).toBeVisible();
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('Offline · still saving')).toBeVisible();
  for (const symptom of sampleSymptoms) await expect(page.getByRole('heading', { name: symptom })).toBeVisible();
  await context.setOffline(false);
});

test('@claim:on-device-records keeps real and demo observation stores isolated', async ({ page }) => {
  await page.goto('/');
  await saveObservation(page, 'Only in real storage');
  await page.goto('/demo');
  await expect(page.getByRole('heading', { name: 'Only in real storage' })).toHaveCount(0);
  await saveObservation(page, 'Only in demo storage');
  const databaseNames = await page.evaluate(async () => (await indexedDB.databases()).map((database) => database.name));
  expect(databaseNames).toEqual(expect.arrayContaining(['symptom-visit-brief', 'demo:symptom-visit-brief']));
  await page.getByRole('button', { name: 'Start for real' }).click();
  await expect(page.getByRole('heading', { name: 'Only in real storage' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Only in demo storage' })).toHaveCount(0);
});

test('@claim:csv-export downloads each sample observation as CSV', async ({ page }) => {
  await page.goto('/demo');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^symptom-visit-brief-.*\.csv$/);
  const csv = await (await download.createReadStream())!.toArray();
  const contents = Buffer.concat(csv).toString('utf8');
  expect(contents).toContain('"Date and time","Symptom","Severity (1–10)","Duration (minutes)","Context","Photo attached"');
  for (const symptom of sampleSymptoms) expect(contents).toContain(symptom);
});

test('@claim:pdf-export downloads a non-empty one-page PDF from sample data', async ({ page }) => {
  await page.goto('/demo');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export one-page PDF' }).click();
  const download = await downloadPromise;
  const pdf = Buffer.concat(await (await download.createReadStream())!.toArray());
  expect(download.suggestedFilename()).toContain('.pdf');
  expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
  expect(pdf.toString('latin1').match(/\/Type \/Page\b/g)).toHaveLength(1);
});

test('@claim:json-backup downloads every sample observation in a portable backup', async ({ page }) => {
  await page.goto('/demo');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export backup' }).click();
  const download = await downloadPromise;
  const backup = JSON.parse(Buffer.concat(await (await download.createReadStream())!.toArray()).toString('utf8')) as { version: number; observations: Array<{ symptom: string }> };
  expect(download.suggestedFilename()).toMatch(/^symptom-visit-brief-backup-.*\.json$/);
  expect(backup.version).toBe(1);
  expect(backup.observations.map((entry) => entry.symptom)).toEqual(expect.arrayContaining(sampleSymptoms));
});

test('@claim:no-third-party-tracking makes only same-origin requests during the demo flow', async ({ page }) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/demo');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  await expect(page.getByText('CSV exported.')).toBeVisible();
  const baseOrigin = new URL(page.url()).origin;
  expect(requests).not.toEqual([]);
  expect(requests.every((url) => new URL(url).origin === baseOrigin)).toBe(true);
});

test('@claim:plus-price shows the one-time $9 unlock without gating exports', async ({ page }) => {
  await page.goto('/demo');
  await expect(page.getByText('Core features are free. Brief Plus costs $9 once.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Unlock Brief Plus · $9' })).toHaveAttribute('href', /\/products\/symptom-visit-brief\/checkout$/);
  await expect(page.getByRole('button', { name: 'Save observation' })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Export CSV' })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Export one-page PDF' })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Export backup' })).toBeEnabled();
});

test('@claim:observation-details saves every observation detail and an optional photo', async ({ page }) => {
  await page.goto('/demo');
  await page.locator('#date').fill('2026-08-31');
  await page.locator('#time').fill('09:25');
  await page.locator('#symptom').fill('Detailed demo observation');
  await page.locator('#severity').fill('8');
  await page.locator('#duration').fill('2');
  await page.locator('#duration-unit').selectOption('60');
  await page.locator('#context').fill('Started after a bright morning walk.');
  await page.locator('#photo').setInputFiles({
    name: 'symptom-note.png',
    mimeType: 'image/png',
    buffer: await readFile('public/icons/icon-192.png')
  });
  await expect(page.getByRole('img', { name: 'Selected photo preview' })).toBeVisible();
  await page.getByRole('button', { name: 'Save observation' }).click();

  const entry = page.locator('.timeline-entry').filter({ has: page.getByRole('heading', { name: 'Detailed demo observation' }) });
  await expect(entry.locator('time')).toHaveAttribute('datetime', /^2026-08-31T09:25/);
  await expect(entry.locator('.severity-node')).toHaveAttribute('aria-label', 'Severity 8 out of 10, High');
  await expect(entry).toContainText('2 hr');
  await expect(entry).toContainText('Started after a bright morning walk.');
  await expect(entry.getByRole('img', { name: 'Photo attached to Detailed demo observation observation' })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Detailed demo observation' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Photo attached to Detailed demo observation observation' })).toBeVisible();
});

test('@claim:timeline-filters narrows the demo timeline by text and dates', async ({ page }) => {
  await page.goto('/demo');
  await page.locator('#filter-query').fill('bright video call');
  await expect(page.locator('#record-count')).toHaveText('1 observation');
  await expect(page.getByRole('heading', { name: 'Headache behind left eye' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Dizziness after standing' })).toHaveCount(0);

  await page.locator('#filter-query').fill('');
  await page.locator('#filter-from').fill('2026-08-25');
  await page.locator('#filter-to').fill('2026-08-25');
  await expect(page.locator('#record-count')).toHaveText('1 observation');
  await expect(page.getByRole('heading', { name: 'Dizziness after bus ride' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Headache behind left eye' })).toHaveCount(0);
});

test('@claim:backup-merge preserves current history and applies newer backup edits', async ({ page }) => {
  await page.goto('/demo');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export backup' }).click();
  const download = await downloadPromise;
  const backup = JSON.parse(Buffer.concat(await (await download.createReadStream())!.toArray()).toString('utf8')) as {
    version: number;
    observations: Array<{ id: string; symptom: string; updatedAt: string; [key: string]: unknown }>;
  };
  const current = backup.observations.find((entry) => entry.id === 'demo-dizziness-1');
  expect(current).toBeDefined();
  if (!current) throw new Error('The shipped sample observation is missing from its backup.');

  const stale = { ...current, symptom: 'Stale imported wording', updatedAt: '2025-01-01T00:00:00.000Z' };
  await page.locator('#import-json').setInputFiles({
    name: 'stale-backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ version: 1, observations: [stale] }))
  });
  await expect(page.getByText('Backup merged: 0 added, 0 updated.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Dizziness after standing' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Stale imported wording' })).toHaveCount(0);

  const newer = { ...current, symptom: 'Updated through backup merge', updatedAt: '2027-01-01T00:00:00.000Z' };
  await page.locator('#import-json').setInputFiles({
    name: 'newer-backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ version: 1, observations: [newer] }))
  });
  await expect(page.getByText('Backup merged: 0 added, 1 updated.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Updated through backup merge' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Dizziness after bus ride' })).toBeVisible();
});

test('@claim:plus-settings saves reusable presets and a personalized brief heading', async ({ page }) => {
  await page.route('https://api.sociobot.in/api/v1/products/symptom-visit-brief/verify**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: true, reason: 'ok', expires_at: null }) });
  });
  await page.goto('/demo?license=demo-plus-license');
  await expect(page.getByText('Brief Plus is unlocked on this device.')).toBeVisible();
  await page.locator('#plus-settings input[name="briefTitle"]').fill('Notes for my next visit');
  await page.locator('#plus-settings input[name="presets"]').fill('Morning dizziness, After lunch fatigue');
  await page.getByRole('button', { name: 'Save Plus settings' }).click();
  await expect(page.locator('.brief-paper h3')).toHaveText('Notes for my next visit');
  await expect(page.getByRole('button', { name: 'Morning dizziness' })).toBeVisible();

  await page.reload();
  await expect(page.locator('.brief-paper h3')).toHaveText('Notes for my next visit');
  await page.getByRole('button', { name: 'Morning dizziness' }).click();
  await expect(page.locator('#symptom')).toHaveValue('Morning dizziness');
});

test('@claim:license-verification sends only a license token and caches the daily result', async ({ page }) => {
  const verificationRequests: Array<{ url: string; method: string; body: string | null }> = [];
  await page.route('https://api.sociobot.in/api/v1/products/symptom-visit-brief/verify**', async (route) => {
    const request = route.request();
    verificationRequests.push({ url: request.url(), method: request.method(), body: request.postData() });
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: true, reason: 'ok', expires_at: null }) });
  });
  await page.goto('/demo?license=demo-license-token');
  await expect(page.getByText('Brief Plus is unlocked on this device.')).toBeVisible();
  await expect.poll(() => verificationRequests).toHaveLength(1);
  expect(verificationRequests[0]).toEqual({
    url: 'https://api.sociobot.in/api/v1/products/symptom-visit-brief/verify?license=demo-license-token',
    method: 'GET',
    body: null
  });

  await page.reload();
  await page.waitForTimeout(250);
  expect(verificationRequests).toHaveLength(1);
});

test('records, persists, filters, exports, and meets the core accessibility baseline', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await page.goto('/');
  await expect(page).toHaveTitle('Symptom Visit Brief — private symptom timeline');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://symptom-visit-brief.sociobot.in/');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /social-preview\.jpg$/);

  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact || ''))).toEqual([]);

  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
  await saveObservation(page, 'Dizziness');
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Dizziness' })).toBeVisible();
  await page.locator('#filter-query').fill('not present');
  await expect(page.getByRole('heading', { name: 'No observations match.' })).toBeVisible();
  await page.locator('#clear-filters').click();
  expect(consoleErrors).toEqual([]);
});

test('uses a 3:1-or-better teal keyboard focus outline in light and dark themes', async ({ page }) => {
  await page.goto('/');
  await page.locator('#symptom').focus();
  await expect(page.locator('#symptom')).toHaveCSS('outline-color', 'rgb(0, 107, 99)');
  await page.emulateMedia({ colorScheme: 'dark' });
  await expect(page.locator('#symptom')).toHaveCSS('outline-color', 'rgb(88, 208, 194)');
});

test('legal and 404 pages are delivered with valid landmarks', async ({ page }) => {
  for (const path of ['/privacy/', '/terms/', '/not-a-real-page']) {
    await page.goto(path);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  }
  await expect(page.getByRole('heading', { name: 'This page was not found.' })).toBeVisible();
});

test('host-equivalent preview applies security headers to demo and hides deployment configuration', async ({ request }) => {
  const demo = await request.get('/demo');
  expect(demo.status()).toBe(200);
  expect(demo.headers()['content-security-policy']).toContain("default-src 'self'");
  expect(demo.headers()['permissions-policy']).toContain('camera=()');
  expect(demo.headers()['referrer-policy']).toBe('strict-origin-when-cross-origin');

  const configuration = await request.get('/staticwebapp.config.json');
  expect(configuration.status()).toBe(404);

  const notFound = await request.get('/not-a-real-page');
  expect(notFound.status()).toBe(404);
});

test('accepts and verifies a returned Sociobot license', async ({ page }) => {
  await page.route('https://api.sociobot.in/api/v1/products/symptom-visit-brief/verify**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ valid: true, reason: 'ok', expires_at: null }) });
  });
  await page.goto('/?license=test-license-token');
  await expect(page.getByText('Brief Plus is unlocked on this device.')).toBeVisible();
  expect(new URL(page.url()).searchParams.has('license')).toBe(false);
  expect(await page.evaluate(() => localStorage.getItem('sb_license:symptom-visit-brief'))).toBe('test-license-token');
  await expect(page.getByRole('button', { name: 'Save Plus settings' })).toBeVisible();
});
