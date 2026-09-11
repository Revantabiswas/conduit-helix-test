// spec: TC-A11Y-02 - All inputs expose an accessible name on login, register, settings
// seed: tests/e2e/seed.spec.ts

import { test, expect } from '@playwright/test';
import { FIXTURE_USER } from '../seed.spec';

test.describe('Accessibility (DOM-observable)', () => {
  test('TC-A11Y-02 - All inputs expose an accessible name on login, register, settings', async ({ page }) => {
    // 1. Precondition: logged out. Navigate to /login.
    await page.goto('/login');

    // Expect: 'Email' and 'Password' each resolve to exactly one accessible-name-addressable field.
    await expect(page.getByRole('textbox', { name: 'Email' })).toHaveCount(1);
    await expect(page.getByRole('textbox', { name: 'Password' })).toHaveCount(1);

    // 2. Navigate to /register.
    await page.goto('/register');

    // Expect: 'Username', 'Email', 'Password' each resolve to exactly one accessible-name-addressable field.
    await expect(page.getByRole('textbox', { name: 'Username' })).toHaveCount(1);
    await expect(page.getByRole('textbox', { name: 'Email' })).toHaveCount(1);
    await expect(page.getByRole('textbox', { name: 'Password' })).toHaveCount(1);

    // 3. Log in as the fixture account, navigate to /settings.
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Email' }).fill(FIXTURE_USER.email);
    await page.getByRole('textbox', { name: 'Password' }).fill(FIXTURE_USER.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/(?!login).*/);

    await page.goto('/settings');

    // Expect: 'Bio', 'Image URL', 'Email' each resolve to exactly one accessible-name-addressable field.
    // Also verifies 'New password (leave blank to keep)' is reachable by accessible name.
    // No field required a CSS-selector fallback (each was reachable by accessible name).
    await expect(page.getByRole('textbox', { name: 'Bio' })).toHaveCount(1);
    await expect(page.getByRole('textbox', { name: 'Image URL' })).toHaveCount(1);
    await expect(page.getByRole('textbox', { name: 'Email' })).toHaveCount(1);
    await expect(page.getByRole('textbox', { name: 'New password (leave blank to keep)' })).toHaveCount(1);
  });
});
