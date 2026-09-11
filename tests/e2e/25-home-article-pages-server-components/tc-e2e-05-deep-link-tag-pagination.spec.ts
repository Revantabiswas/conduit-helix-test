// spec: specs/plan.md
// seed: tests/e2e/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Home Feed and Navigation', () => {
  test('TC-E2E-05 - Deep-link directly to a tag+pagination URL reproduces the exact feed on cold load', async ({
    page,
  }) => {
    // 1. First, in one context, load /?tag=pwtag&page=1 and record the set of visible article preview titles/links (page 1 set).
    await page.goto('/?tag=pwtag&page=1');
    const page1Articles = page.locator('a[href^="/article/"]');
    await expect(page1Articles.first()).toBeVisible();
    await expect(page1Articles).toHaveCount(10);
    await expect(page.getByRole('heading', { name: 'PW Markdown Rich' })).toBeVisible();
    await expect(page.locator('a[href="/article/pw-seed-article-4"]')).not.toBeVisible();
    await expect(page.locator('a[href="/article/pw-cookie-test"]')).not.toBeVisible();

    // 2. In a fresh cold load, navigate directly to /?tag=pwtag&page=2 (no prior nav).
    await page.goto('/?tag=pwtag&page=2');

    // 3. Assert the page renders the pwtag-filtered feed page 2 on cold load: assert article preview cards are
    // visible AND the set differs from page 1 (at least one article visible on page 2 that was NOT on page 1,
    // and fewer/different items — page 2 has ~5). This proves the URL alone (tag + page) reconstructs feed
    // state on a hard load.
    const page2Articles = page.locator('a[href^="/article/"]');
    await expect(page2Articles.first()).toBeVisible();
    await expect(page2Articles).toHaveCount(5);
    await expect(page.getByRole('heading', { name: 'PW Seed Article 4' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'PW Cookie Test' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'PW Markdown Rich' })).not.toBeVisible();

    // 4. Assert the URL is exactly /?tag=pwtag&page=2 and the page did not redirect.
    await expect(page).toHaveURL('http://localhost:3000/?tag=pwtag&page=2');
  });
});
