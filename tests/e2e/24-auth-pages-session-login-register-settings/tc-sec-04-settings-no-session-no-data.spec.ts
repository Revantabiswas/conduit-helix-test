// spec: specs/plan.md
// seed: tests/e2e/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Session and Logout', () => {
  test('TC-SEC-04 - Protected route /settings not reachable without a session (no data exposure)', async ({ page, context }) => {
    // 1. Precondition: logged out with cookies cleared (fresh context; if needed call context.clearCookies() after confirming logged-out).
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);
    await context.clearCookies();

    // 2. Navigate directly to /settings.
    await page.goto('/settings');

    // Expect: header shows the logged-out state (Sign in / Sign up links present) — confirms no session.
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible();

    // Expect: settings fields (Bio, Image URL, Email, New password) render but are EMPTY — no authenticated user data (no fixture bio/email) displayed.
    const bioInput = page.getByRole('textbox', { name: 'Bio' });
    const imageUrlInput = page.getByRole('textbox', { name: 'Image URL' });
    const emailInput = page.getByRole('textbox', { name: 'Email' });
    const newPasswordInput = page.getByRole('textbox', { name: 'New password (leave blank to keep)' });

    await expect(bioInput).toBeVisible();
    await expect(bioInput).toBeEmpty();
    await expect(imageUrlInput).toBeVisible();
    await expect(imageUrlInput).toBeEmpty();
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toBeEmpty();
    await expect(newPasswordInput).toBeVisible();
    await expect(newPasswordInput).toBeEmpty();

    // 3. Attempt to submit: click 'Update Settings' and observe the PUT /api/user response via waitForResponse.
    const putUserResponsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/user') && response.request().method() === 'PUT'
    );
    await page.getByRole('button', { name: 'Update Settings' }).click();
    const putUserResponse = await putUserResponsePromise;

    // Expect: PUT /api/user returns 401; an 'errors' list shows an authentication-required message
    // matching case-insensitive /login first|need to login|unauthor/; the mutating action is rejected
    // server-side even though no client redirect occurred.
    expect(putUserResponse.status()).toBe(401);

    const errorsList = page.getByRole('list', { name: 'errors' });
    await expect(errorsList).toBeVisible();
    await expect(errorsList).toContainText(/login first|need to login|unauthor/i);

    // No client redirect: still on /settings.
    await expect(page).toHaveURL(/\/settings/);
  });
});
