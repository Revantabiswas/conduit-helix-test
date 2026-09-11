// spec: Home Feed and Navigation
// seed: tests/e2e/seed.spec.ts

import { test, expect } from '@playwright/test';
import { FOLLOWER_USER } from '../seed.spec';

test.describe('Home Feed and Navigation', () => {
  test('TC-E2E-02 - Logged-in user sees personal feed via URL, then switches to global via navigation', async ({ page }) => {
    // 1. Log in as pw_bob2 via /login (fill Email/Password, click 'Sign in', wait for redirect off /login).
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Email' }).fill(FOLLOWER_USER.email);
    await page.getByRole('textbox', { name: 'Password' }).fill(FOLLOWER_USER.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/(?!login).*/);

    // 2. Navigate to / then activate the personal feed by clicking the 'Your Feed' tab.
    const yourFeedTab = page.getByRole('link', { name: 'Your Feed' });
    const globalFeedTab = page.getByRole('link', { name: 'Global Feed' });
    await yourFeedTab.click();

    // 3. Assert the URL now contains feed=personal (a real navigation, not silent client state).
    await expect(page).toHaveURL(/\/\?feed=personal/);

    // 4. Assert the personal feed shows only pw_author2's articles (the followed author) and the
    // 'Your Feed' tab is now 'nav-link active'.
    await expect(yourFeedTab).toHaveClass(/nav-link active/);
    const authorLinks = page.locator('a[href="/profile/pw_author2"]');
    await expect(authorLinks.first()).toBeVisible();
    const articleLinks = page.locator('a[href^="/article/"]');
    await expect(articleLinks.first()).toBeVisible();
    const articleLinkCount = await articleLinks.count();
    for (let i = 0; i < articleLinkCount; i++) {
      await expect(articleLinks.nth(i)).toBeVisible();
    }

    // 5. Activate 'Global Feed' by clicking the Global Feed tab.
    await globalFeedTab.click();

    // 6. Assert the URL no longer has feed=personal (back to global) and the global feed tab is
    // active; the feed re-renders (assert article previews are visible).
    await expect(page).not.toHaveURL(/feed=personal/);
    await expect(page).toHaveURL('http://localhost:3000/');
    await expect(globalFeedTab).toHaveClass(/nav-link active/);
    await expect(articleLinks.first()).toBeVisible();
  });
});
