// spec: Session and Logout
// seed: tests/e2e/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Session and Logout', () => {
  test('TC-SEC-07 - Injection-style input in auth fields handled safely', async ({ page }) => {
    // 1. Precondition: logged out. Register a page dialog handler that FAILS the test if any
    // dialog (alert/confirm/prompt) fires at any point (record and dismiss; assert none fired at the end).
    const dialogsFired: string[] = [];
    page.on('dialog', async (dialog) => {
      dialogsFired.push(dialog.message());
      await dialog.dismiss();
    });

    // 2. Navigate to /register. Fill Username with '<script>alert(1)</script>', Email with a
    // valid-format unique address, Password with 'Passw0rd!123'. Click 'Sign up'.
    await page.goto('/register');
    await page.getByRole('textbox', { name: 'Username' }).fill('<script>alert(1)</script>');
    await page.getByRole('textbox', { name: 'Email' }).fill(`xss_${Date.now()}@example.com`);
    await page.getByRole('textbox', { name: 'Password' }).fill('Passw0rd!123');
    await page.getByRole('button', { name: 'Sign up' }).click();

    // Expected: no JS dialog fires; the injected script is NOT executed — either registration is
    // rejected with a visible 'errors' list, OR it succeeds and the username is rendered as inert
    // escaped text, never executed. No raw server error / stack trace shown on the page.
    // NOTE: the app rejects this username via client-side validation ("Username must be 3-30
    // characters..." in the errors list), so only the rejected branch is exercised in practice.
    // The success-branch assertion below is kept for completeness in case validation rules
    // change, but it must NOT also be required when registration was rejected.
    const registerErrorsList = page.getByRole('list', { name: 'errors' });
    const scriptDialogElement = page.locator('script:has-text("alert(1)")');
    // Wait for the app to settle on one of the two possible outcomes (rejected via client-side
    // validation errors, or accepted and rendered as inert text) before branching, instead of
    // sampling visibility immediately (which raced the in-flight POST /api/users request).
    const isRejected = await registerErrorsList
      .waitFor({ state: 'visible', timeout: 10000 })
      .then(() => true)
      .catch(() => false);
    if (isRejected) {
      await expect(registerErrorsList).toBeVisible();
    } else {
      // Registration succeeded — the injected markup must render as inert escaped text.
      await expect(page.getByText('<script>alert(1)</script>')).toBeVisible();
    }
    await expect(scriptDialogElement).toHaveCount(0);
    await expect(page.getByText(/stack trace|internal server error|at Object\.|at async/i)).toHaveCount(0);

    // 3. Ensure logged out for the next step (if step 2 logged in, log out via /settings 'Log out').
    const logOutButton = page.getByRole('button', { name: 'Log out' });
    await page.goto('/settings');
    if (await logOutButton.isVisible().catch(() => false)) {
      await logOutButton.click();
    }

    // Navigate to /login. Fill Email with the SQL-ish probe and Password with any value. Click 'Sign in'.
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Email' }).fill("' OR '1'='1");
    await page.getByRole('textbox', { name: 'Password' }).fill('whatever123');
    await page.getByRole('button', { name: 'Sign in' }).click();

    // Expected: login does NOT succeed — URL remains /login and/or an 'errors' list is shown;
    // the probe does not bypass auth. No dialog fires. No raw server error/stack trace shown.
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible();
    await expect(page.getByText(/stack trace|internal server error|at Object\.|at async/i)).toHaveCount(0);

    // 4. Final assertion: zero dialogs fired during the whole test.
    expect(dialogsFired).toHaveLength(0);
  });
});
