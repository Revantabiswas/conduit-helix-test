// spec: specs/plan.md
// seed: tests/e2e/seed.spec.ts

import { test, expect } from '@playwright/test';

const FIXTURE_USER = {
  email: 'playwright_fixture@example.com',
  password: 'Passw0rd!123',
  username: 'playwright_fixture',
};

test.describe('Session and Logout', () => {
  test('TC-E2E-06 - Logout clears the session and produces a logged-out state', async ({ page }) => {
    // 1. Precondition: log in as the fixture account via /login. Navigate to /settings (the page hosting the Log out control).
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Email' }).fill(FIXTURE_USER.email);
    await page.getByRole('textbox', { name: 'Password' }).fill(FIXTURE_USER.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/(?!login).*/);

    await page.goto('/settings');
    const logOutButton = page.getByRole('button', { name: 'Log out' });
    await expect(logOutButton).toBeVisible();

    // 2. Click the 'Log out' button.
    // Expect: URL navigates to / (Home). Header switches to logged-out state:
    // 'Sign in' and 'Sign up' links visible; 'Settings'/'New Article'/username link gone.
    await logOutButton.click();
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Settings' })).not.toBeVisible();
    await expect(page.getByRole('link', { name: 'New Article' })).not.toBeVisible();
    await expect(page.getByRole('link', { name: FIXTURE_USER.username })).not.toBeVisible();

    // 3. Navigate directly to /settings.
    // Expect: header shows the logged-out state on this page too; no authenticated profile
    // data is displayed (form fields empty; no fixture-account data shown).
    await page.goto('/settings');
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Settings' })).not.toBeVisible();
    await expect(page.getByRole('link', { name: 'New Article' })).not.toBeVisible();
    await expect(page.getByRole('link', { name: FIXTURE_USER.username })).not.toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Email' })).toBeEmpty();
  });
});
