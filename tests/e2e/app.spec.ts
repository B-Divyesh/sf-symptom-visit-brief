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
  await expect(page.getByRole('button', { name: 'Export CSV' })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Export one-page PDF' })).toBeEnabled();
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
  for (const path of ['/privacy/', '/terms/', '/404.html']) {
    await page.goto(path);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  }
  await expect(page.getByRole('heading', { name: 'This page is not in your timeline.' })).toBeVisible();
});

test('production deployment policy serves the styled 404 and secure cache headers', async () => {
  const policy = JSON.parse(await readFile('dist/staticwebapp.config.json', 'utf8')) as {
    routes: Array<{ route: string; rewrite?: string; headers?: Record<string, string> }>;
    responseOverrides: Record<string, { rewrite: string; statusCode: number }>;
  };
  expect(policy.responseOverrides['404']).toEqual({ rewrite: '/404.html', statusCode: 404 });
  expect(policy.routes.find((route) => route.route === '/demo')?.rewrite).toBe('/index.html');
  expect(policy.routes.find((route) => route.route === '/assets/*')?.headers?.['Cache-Control']).toContain('immutable');
  expect(policy.routes.find((route) => route.route === '/sw.js')?.headers?.['Cache-Control']).toContain('no-cache');
  expect(policy.routes.find((route) => route.route === '/*')?.headers?.['Content-Security-Policy']).toContain("default-src 'self'");
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
