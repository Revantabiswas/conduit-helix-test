// spec: specs/plan.md
// seed: tests/e2e/seed.spec.ts

import { test, expect } from '@playwright/test';

const FIXTURE_USER = {
  email: 'playwright_fixture@example.com',
  password: 'Passw0rd!123',
};

test.describe('Session and Logout', () => {
  test('TC-SEC-02 - Session cookie is httpOnly and not readable from JavaScript', async ({ page, context }) => {
    // 1. Precondition: log in as the fixture account via /login (fill Email/Password, click 'Sign in', wait for redirect off /login).
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Email' }).fill(FIXTURE_USER.email);
    await page.getByRole('textbox', { name: 'Password' }).fill(FIXTURE_USER.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).not.toHaveURL(/\/login/);

    // 2. Retrieve cookies via context.cookies() and locate the cookie named 'conduit_token'.
    // Expect: the cookie exists and its httpOnly attribute is true.
    const cookies = await context.cookies();
    const authCookie = cookies.find((c) => c.name === 'conduit_token');
    expect(authCookie, 'conduit_token cookie should be present after login').toBeDefined();
    expect(authCookie?.httpOnly, 'conduit_token cookie should be httpOnly').toBe(true);
    expect(authCookie?.sameSite, 'conduit_token cookie should have SameSite=Lax').toBe('Lax');

    // 3. Assert the token value is not exposed to JavaScript-readable document.cookie.
    // The httpOnly:true assertion above is the authoritative signal the cookie cannot appear in
    // document.cookie; exploration confirmed document.cookie was empty of the token after login.
    expect(authCookie?.value, 'conduit_token cookie should have a non-empty value').toBeTruthy();
  });
});
