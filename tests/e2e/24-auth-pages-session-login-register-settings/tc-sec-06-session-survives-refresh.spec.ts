// spec: specs/plan.md
// seed: tests/e2e/seed.spec.ts

import { test, expect } from '@playwright/test';

const FIXTURE_USER = {
  email: 'playwright_fixture@example.com',
  password: 'Passw0rd!123',
  username: 'playwright_fixture',
};

// Matches an auth-credential-looking value: either a JWT (xxx.yyy.zzz) or a long opaque token string.
const JWT_PATTERN = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
const CREDENTIAL_KEY_PATTERN = /token|jwt|auth|user/i;

function assertNoAuthTokenInLocalStorage(
  storageState: Awaited<ReturnType<import('@playwright/test').BrowserContext['storageState']>>
) {
  const origin = storageState.origins.find((o) => o.origin === 'http://localhost:3000');
  if (!origin) return;

  for (const item of origin.localStorage) {
    const looksLikeCredentialKey = CREDENTIAL_KEY_PATTERN.test(item.name);
    const looksLikeJwtValue = JWT_PATTERN.test(item.value);
    expect(looksLikeCredentialKey && looksLikeJwtValue, `localStorage key "${item.name}" should not hold an auth credential`).toBeFalsy();
    expect(looksLikeJwtValue, `localStorage key "${item.name}" should not hold a JWT-shaped value`).toBeFalsy();
  }
}

test.describe('Session and Logout', () => {
  test('TC-SEC-06 - Session survives refresh via the cookie, not client storage', async ({ page, context }) => {
    // 1. Precondition: log in as the fixture account via /login.
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Email' }).fill(FIXTURE_USER.email);
    await page.getByRole('textbox', { name: 'Password' }).fill(FIXTURE_USER.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).not.toHaveURL(/\/login/);

    const settingsLink = page.getByRole('link', { name: 'Settings' });
    const newArticleLink = page.getByRole('link', { name: 'New Article' });
    const usernameLink = page.getByRole('link', { name: FIXTURE_USER.username });

    // 2. Assert localStorage holds no auth token BEFORE refresh (via context.storageState()).
    const storageStateBefore = await context.storageState();
    assertNoAuthTokenInLocalStorage(storageStateBefore);

    // 3. Confirm the 'conduit_token' session cookie exists via context.cookies().
    const cookiesBefore = await context.cookies();
    const authCookieBefore = cookiesBefore.find((c) => c.name === 'conduit_token');
    expect(authCookieBefore).toBeDefined();
    expect(authCookieBefore?.value).toBeTruthy();

    // 4. Perform a full page reload (page.reload()).
    // Expect: still logged in after reload — logged-in header affordances visible (Settings/New Article/playwright_fixture link).
    await page.reload();
    await expect(page).not.toHaveURL(/\/login/);
    await expect(settingsLink).toBeVisible();
    await expect(newArticleLink).toBeVisible();
    await expect(usernameLink).toBeVisible();

    // 5. Re-assert localStorage after refresh still holds no auth token (context.storageState()).
    const storageStateAfter = await context.storageState();
    assertNoAuthTokenInLocalStorage(storageStateAfter);

    const cookiesAfter = await context.cookies();
    const authCookieAfter = cookiesAfter.find((c) => c.name === 'conduit_token');
    expect(authCookieAfter).toBeDefined();
    expect(authCookieAfter?.value).toBeTruthy();
  });
});
