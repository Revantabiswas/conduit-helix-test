// spec: specs/plan.md
// seed: tests/e2e/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Home Feed and Navigation', () => {
  test('TC-E2E-01 - Anonymous visitor lands on home, sees global feed + popular-tags sidebar + pagination', async ({ page }) => {
    // 1. Navigate to /.
    await page.goto('/');

    // 2. Expect: page loads and multiple article preview cards render in the feed.
    const articleCards = page.locator('a[href^="/article/"]');
    await expect(articleCards.first()).toBeVisible();
    await expect(articleCards).toHaveCount(10);

    // 3. Expect: a popular-tags sidebar is visible and lists one or more tags, including 'pwtag'.
    await expect(page.getByText('Popular Tags')).toBeVisible();
    const pwtagSidebarLink = page.locator('a[href="/?tag=pwtag"]');
    await expect(pwtagSidebarLink).toBeVisible();

    // 4. Expect: the global feed tab is present and active (element with 'nav-link active' reflecting Global Feed). The header shows anonymous affordances (Sign in / Sign up links).
    const activeNavLink = page.locator('.nav-link.active');
    await expect(activeNavLink).toBeVisible();
    await expect(activeNavLink).toHaveText('Global Feed');
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible();

    // 5. Pagination: since there are >10 articles, assert page 2 is reachable via the 'page' search param by navigating to /?page=2 and confirming the feed shows a different set (fewer/different article titles than page 1). Do NOT look for a clickable pagination control — it does not exist; assert the page param works instead.
    await page.goto('/?page=2');
    await expect(page.getByRole('link', { name: 'Hello Conduit first post Read' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'PW Markdown Rich' })).not.toBeVisible();
  });
});
