import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('records, persists, filters, exports, and works offline', async ({ page, context }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Small observations. One useful timeline.' })).toBeVisible();

  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact || ''))).toEqual([]);

  await page.locator('#symptom').fill('Dizziness');
  await page.locator('#severity').fill('7');
  await page.locator('#duration').fill('20');
  await page.locator('#context').fill('After standing from desk');
  await page.locator('#photo').setInputFiles({
    name: 'observation.png',
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64')
  });
  await expect(page.getByAltText('Selected photo preview')).toBeVisible();
  await page.getByRole('button', { name: 'Save observation' }).click();
  await expect(page.getByText('Observation saved on this device.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Dizziness' })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Dizziness' })).toBeVisible();
  await page.locator('#filter-query').fill('not present');
  await expect(page.getByRole('heading', { name: 'No observations match.' })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters' }).click();

  const csvDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export CSV' }).click();
  expect((await csvDownload).suggestedFilename()).toContain('symptom-visit-brief');
  const pdfDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export one-page PDF' }).click();
  expect((await pdfDownload).suggestedFilename()).toContain('.pdf');

  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByText('Offline · still saving')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Dizziness' })).toBeVisible();
  await context.setOffline(false);
  expect(consoleErrors).toEqual([]);
});

test('legal pages have landmarks and one heading', async ({ page }) => {
  for (const path of ['/privacy/', '/terms/']) {
    await page.goto(path);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  }
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
