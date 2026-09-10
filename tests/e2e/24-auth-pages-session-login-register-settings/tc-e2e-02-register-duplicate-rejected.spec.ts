// spec: specs/plan.md
// seed: tests/e2e/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Login and Register', () => {
  test('TC-E2E-02 - Register rejected when username/email already taken', async ({ page }) => {
    // 1. Precondition: logged out (fresh context). Navigate to /login to confirm the logged-out
    // header first, then to /register.
    await page.goto('/login');
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible();

    await page.goto('/register');

    // Expect: heading 'Sign up' visible.
    await expect(page.getByRole('heading', { name: 'Sign up' })).toBeVisible();

    // 2. Fill Username with 'playwright_fixture', Email with 'playwright_fixture@example.com',
    // Password with any valid-format password e.g. 'SomePassw0rd!1'.
    const usernameField = page.getByRole('textbox', { name: 'Username' });
    const emailField = page.getByRole('textbox', { name: 'Email' });
    const passwordField = page.getByRole('textbox', { name: 'Password' });

    await usernameField.fill('playwright_fixture');
    await emailField.fill('playwright_fixture@example.com');
    await passwordField.fill('SomePassw0rd!1');

    // 3. Click the 'Sign up' button.
    await page.getByRole('button', { name: 'Sign up' }).click();

    // Expected: URL remains on /register (registration did not succeed).
    await expect(page).toHaveURL(/\/register/);

    // Expected: An 'errors' list (role list, accessible name 'errors') becomes visible
    // containing a message matching case-insensitive /already exist|taken/.
    const errorsList = page.getByRole('list', { name: 'errors' });
    await expect(errorsList).toBeVisible();
    await expect(errorsList).toContainText(/already exist|taken/i);

    // Expected: Header still shows the logged-out state (Sign in / Sign up links present) —
    // no session established.
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible();

    // Expected: The Username/Email/Password textboxes still contain the submitted values
    // (form not cleared).
    await expect(usernameField).toHaveValue('playwright_fixture');
    await expect(emailField).toHaveValue('playwright_fixture@example.com');
    await expect(passwordField).toHaveValue('SomePassw0rd!1');
  });
});
