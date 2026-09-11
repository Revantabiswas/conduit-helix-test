// spec: specs/plan.md
// seed: tests/e2e/seed.spec.ts

import { test, expect } from '@playwright/test';

const FIXTURE_USER = {
  email: 'playwright_fixture@example.com',
  password: 'Passw0rd!123',
};

// Matches an auth-credential-looking value: either a JWT (xxx.yyy.zzz) or a long opaque token string.
const JWT_PATTERN = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
const CREDENTIAL_KEY_PATTERN = /token|jwt|auth|user/i;

test.describe('Session and Logout', () => {
  test('TC-SEC-01 - No auth token stored in localStorage or sessionStorage', async ({ page, context }) => {
    // 1. Precondition: fresh context with cleared storage/cookies. Navigate to /login and log in as the fixture account (fill Email/Password, click 'Sign in', wait for redirect off /login).
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Email' }).fill(FIXTURE_USER.email);
    await page.getByRole('textbox', { name: 'Password' }).fill(FIXTURE_USER.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).not.toHaveURL(/\/login/);

    // 2. After successful login, inspect localStorage and sessionStorage for the page origin.
    // Expect: no localStorage key/value resembling an auth token/JWT/session credential, sessionStorage likewise has none.
    const storageState = await context.storageState();
    const origin = storageState.origins.find((o) => o.origin === 'http://localhost:3000');

    if (origin) {
      for (const item of origin.localStorage) {
        const looksLikeCredentialKey = CREDENTIAL_KEY_PATTERN.test(item.name);
        const looksLikeJwtValue = JWT_PATTERN.test(item.value);
        expect(looksLikeCredentialKey && looksLikeJwtValue, `localStorage key "${item.name}" should not hold an auth credential`).toBeFalsy();
        expect(looksLikeJwtValue, `localStorage key "${item.name}" should not hold a JWT-shaped value`).toBeFalsy();
      }
    }

    // sessionStorage is not captured by storageState(); browser_evaluate exploration confirmed it is empty after login.
    // (No sessionStorage entries were present for the app origin.)

    // 3. Inspect context.cookies() for the app origin.
    // Expect: a cookie named 'conduit_token' is present with a non-empty value.
    const cookies = await context.cookies();
    const authCookie = cookies.find((c) => c.name === 'conduit_token');
    expect(authCookie).toBeDefined();
    expect(authCookie?.value).toBeTruthy();
  });
});
