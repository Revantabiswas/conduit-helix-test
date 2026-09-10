// spec: specs/plan.md
// seed: tests/e2e/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Login and Register', () => {
  test('TC-E2E-01 - Register through the page and land logged in', async ({ page }) => {
    // 1. Precondition: fresh browser context / cleared session (no cookies). Generate a unique username and email for this run using Date.now().
    const u = `pw_e2e_${Date.now()}`;
    const email = `${u}@example.com`;
    const password = 'Passw0rd!123';

    // 2. Navigate to /login first to establish a clean logged-out baseline, then navigate to /register.
    await page.goto('/login');
    await page.goto('/register');

    // Expect: heading 'Sign up' visible and logged-out header (Sign in / Sign up links present).
    await expect(page.getByRole('heading', { name: 'Sign up' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible();

    // 3. Fill Username with the unique username, Email with the unique email, Password with 'Passw0rd!123'.
    await page.getByRole('textbox', { name: 'Username' }).fill(u);
    await page.getByRole('textbox', { name: 'Email' }).fill(email);
    await page.getByRole('textbox', { name: 'Password' }).fill(password);

    // 4. Click the 'Sign up' button.
    await page.getByRole('button', { name: 'Sign up' }).click();

    // Expected: Navigation occurs away from /register (URL no longer matches /register).
    await expect(page).not.toHaveURL(/\/register/);

    // Expected: Header switches to logged-in affordances: 'New Article' link, 'Settings' link,
    // and a link containing the new username are visible; 'Sign in'/'Sign up' are gone.
    await expect(page.getByRole('link', { name: 'New Article' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible();
    await expect(page.getByRole('link', { name: u })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeHidden();
    await expect(page.getByRole('link', { name: 'Sign up' })).toBeHidden();

    // Expected: No 'errors' list is present on the page.
    await expect(page.getByRole('list', { name: 'errors' })).toHaveCount(0);
  });
});
