import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, test } from '@playwright/test';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const fixturesRoot = path.join(repoRoot, 'test-fixtures/instagram');

const validFiles = [
  path.join(fixturesRoot, 'valid/connections/followers_and_following/followers_1.json'),
  path.join(fixturesRoot, 'valid/connections/followers_and_following/followers_2.json'),
  path.join(fixturesRoot, 'valid/connections/followers_and_following/following.json'),
];

test('imports a valid synthetic export and verifies results without network data leakage', async ({
  page,
}) => {
  const requestUrls: string[] = [];
  page.on('request', (request) => {
    requestUrls.push(request.url());
  });

  await page.goto('./');
  await page.getByLabel('Choose Instagram export files').setInputFiles(validFiles);
  await expect(page.locator('.file-selection')).toHaveText('3 files selected');
  await page.getByRole('button', { name: /analyze selected export/i }).click();

  await expect(page.getByText(/analysis complete/i)).toBeVisible();
  const stats = page.getByRole('heading', { name: /statistics summary/i }).locator('..').locator('..');
  await expect(stats).toContainText('Followers');
  await expect(stats).toContainText('3');
  await expect(stats).toContainText('Following');
  await expect(stats).toContainText('2');

  await page.getByRole('tab', { name: /you do not follow back/i }).click();
  await expect(page.getByRole('link', { name: /@beta.friend/i })).toBeVisible();

  await page.getByLabel(/search usernames/i).fill('gamma');
  await expect(page.getByRole('link', { name: /@Gamma_Friend/i })).toBeVisible();

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /export csv/i }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('instascope-notFollowedBackByUser.csv');

  expect(requestUrls.some((url) => /alpha_friend|beta\.friend|Gamma_Friend/u.test(url))).toBe(false);
  expect(
    requestUrls.every((url) => url.startsWith('http://127.0.0.1:4173/instascope/')),
  ).toBe(true);

  await page.getByRole('button', { name: /start over/i }).click();
  await expect(page.getByRole('heading', { name: /ready when your export is/i })).toBeVisible();
});

test('shows an accessible error for an invalid file', async ({ page }) => {
  await page.goto('./');
  await page
    .getByLabel('Choose Instagram export files')
    .setInputFiles(path.join(fixturesRoot, 'invalid/not-instagram.json'));
  await page.getByRole('button', { name: /analyze selected export/i }).click();

  await expect(page.getByRole('alert')).toContainText(/missing the expected Instagram relationship keys/i);
});

test('loads the built app under the GitHub Pages base path', async ({ page }) => {
  await page.goto('/instascope/');
  await expect(page.getByRole('heading', { level: 1, name: 'InstaScope' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('button', { name: /choose or drop instagram export files/i })).toBeVisible();
});
