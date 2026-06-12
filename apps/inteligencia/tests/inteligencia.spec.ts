import { test, expect } from '@playwright/test';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3007';

const routes = [
  '/inteligencia/cross',
  '/inteligencia/adocao',
  '/inteligencia/feedback',
  '/inteligencia/roadmap',
  '/inteligencia',
];

for (const route of routes) {
  test(`UI loads for ${route}`, async ({ page }) => {
    await page.goto(`${baseUrl}${route}`);
    await expect(page).toHaveURL(`${baseUrl}${route}`);
    // Basic sanity check: ensure main heading exists
    const heading = await page.locator('h1, h2, h3').first();
    await expect(heading).toBeVisible();
  });
}
