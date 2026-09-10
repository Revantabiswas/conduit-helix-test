// spec: specs/plan.md
// seed: tests/e2e/seed.spec.ts

import { test, expect } from '@playwright/test';

const FIXTURE_USER = {
  email: 'playwright_fixture@example.com',
  password: 'Passw0rd!123',
};

test.describe('Session and Logout', () => {
  test('TC-SEC-05 - Logout clears the session cookie server-side', async ({ page, context }) => {
    // 1. Precondition: log in as the fixture account via /login.
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Email' }).fill(FIXTURE_USER.email);
    await page.getByRole('textbox', { name: 'Password' }).fill(FIXTURE_USER.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).not.toHaveURL(/\/login/);

    // 2. Inspect context.cookies() and confirm the 'conduit_token' cookie is present; capture its value.
    const cookiesAfterLogin = await context.cookies();
    const authCookieAfterLogin = cookiesAfterLogin.find((c) => c.name === 'conduit_token');
    expect(authCookieAfterLogin, 'conduit_token cookie should be present after login').toBeDefined();
    expect(authCookieAfterLogin?.value, 'conduit_token cookie should have a non-empty value').toBeTruthy();

    // 3. Navigate to /settings and click the 'Log out' button.
    await page.goto('/settings');
    const logOutButton = page.getByRole('button', { name: 'Log out' });
    await logOutButton.click();

    // Expect: redirect to / with the logged-out header (Sign in / Sign up visible).
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible();

    // 4. Re-inspect context.cookies() for the app origin.
    // Expect: no 'conduit_token' cookie present (removed/cleared, not merely emptied).
    const cookiesAfterLogout = await context.cookies();
    const authCookieAfterLogout = cookiesAfterLogout.find((c) => c.name === 'conduit_token');
    expect(authCookieAfterLogout, 'conduit_token cookie should be removed after logout').toBeUndefined();

    // 5. Navigate directly to /settings.
    // Expect: logged-out header shown; no authenticated data rendered (empty fields).
    await page.goto('/settings');
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Email' })).toBeEmpty();
  });
});
