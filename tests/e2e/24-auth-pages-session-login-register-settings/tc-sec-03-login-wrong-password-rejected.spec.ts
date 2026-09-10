// spec: Login and Register
// seed: tests/e2e/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Login and Register', () => {
  test('TC-SEC-03 - Login with wrong password is rejected and creates no session', async ({ page, context }) => {
    // 1. Precondition: logged out (fresh context). Navigate to /login. Expect: heading 'Sign in' visible.
    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();

    // 2. Fill Email with 'playwright_fixture@example.com' and Password with 'WrongPassword!999'.
    await page.getByRole('textbox', { name: 'Email' }).fill('playwright_fixture@example.com');
    await page.getByRole('textbox', { name: 'Password' }).fill('WrongPassword!999');

    // 3. Click the 'Sign in' button.
    await page.getByRole('button', { name: 'Sign in' }).click();

    // Expected: URL remains on /login.
    await expect(page).toHaveURL(/\/login/);

    // Expected: An 'errors' list becomes visible with a generic message containing 'wrong' or 'invalid'.
    const errorsList = page.getByRole('list', { name: 'errors' });
    await expect(errorsList).toBeVisible();
    await expect(errorsList).toContainText(/wrong|invalid/i);

    // Expected: Inspecting the browser context cookies for the app origin shows NO 'conduit_token' cookie was set.
    const cookies = await context.cookies();
    expect(cookies.find((cookie) => cookie.name === 'conduit_token')).toBeUndefined();

    // Expected: Header still shows the logged-out state (Sign in / Sign up links present).
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible();
  });
});
