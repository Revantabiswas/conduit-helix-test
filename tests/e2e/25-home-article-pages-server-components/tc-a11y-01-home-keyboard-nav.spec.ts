// spec: specs/plan.md
// seed: tests/e2e/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  test('TC-A11Y-01 - Home page keyboard-only navigation reaches interactive elements in a sensible order', async ({ page }) => {
    // 1. Navigate to /.
    await page.goto('/');

    // 2. Press Tab repeatedly from the top and record the sequence of focused elements.
    // Verify keyboard focus reaches: a nav link (brand), Home, Sign in, Sign up.
    const brandLink = page.getByRole('navigation').getByRole('link', { name: 'conduit helix aire test' });
    const homeLink = page.getByRole('link', { name: 'Home' });
    const signInLink = page.getByRole('link', { name: 'Sign in' });
    const signUpLink = page.getByRole('link', { name: 'Sign up' });
    const globalFeedTab = page.getByRole('link', { name: 'Global Feed' });

    await page.keyboard.press('Tab');
    await expect(brandLink).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(homeLink).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(signInLink).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(signUpLink).toBeFocused();

    // Verify keyboard focus reaches the Global Feed / Your Feed feed toggle.
    await page.keyboard.press('Tab');
    await expect(globalFeedTab).toBeFocused();

    // Continue tabbing into the first article card (author avatar -> author name -> article link).
    await page.keyboard.press('Tab');
    const firstAuthorAvatarLink = page.locator('a[href="/profile/pw_author2"]').first();
    await expect(firstAuthorAvatarLink).toBeFocused();

    await page.keyboard.press('Tab');
    const firstAuthorNameLink = page.getByRole('link', { name: 'pw_author2' }).first();
    await expect(firstAuthorNameLink).toBeFocused();

    // Verify keyboard focus reaches at least one article preview link.
    await page.keyboard.press('Tab');
    const firstArticleLink = page.locator('a[href="/article/pw-markdown-rich"]');
    await expect(firstArticleLink).toBeFocused();

    // 3. Assert Tab always advances to a new element (no focus trap):
    // Shift+Tab moves focus backward to the previously focused element.
    await page.keyboard.press('Shift+Tab');
    await expect(firstAuthorNameLink).toBeFocused();

    // Tab forward again confirms the order is consistent (no trap).
    await page.keyboard.press('Tab');
    await expect(firstArticleLink).toBeFocused();

    // 4. Assert the article preview link is reachable and can be activated by keyboard.
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('http://localhost:3000/article/pw-markdown-rich');

    // Go back to continue verifying the popular-tags sidebar link.
    await page.goto('/');

    // Tab from the top through nav, feed toggle and all article cards (8 tabs to reach the
    // first article link, then 28 more tabs through the remaining 8 article cards) to reach
    // the popular-tags sidebar, verifying keyboard focus reaches at least one popular-tag
    // link (pwtag).
    for (let i = 0; i < 8 + 28; i++) {
      await page.keyboard.press('Tab');
    }
    const introTagLink = page.locator('a[href="/?tag=intro"]');
    await expect(introTagLink).toBeFocused();

    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const pwtagLink = page.locator('a[href="/?tag=pwtag"]');
    await expect(pwtagLink).toBeFocused();

    // Assert the pwtag link can be activated by keyboard (Enter) and confirm URL change.
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL('http://localhost:3000/?tag=pwtag');

    await page.goto('/');
  });
});
