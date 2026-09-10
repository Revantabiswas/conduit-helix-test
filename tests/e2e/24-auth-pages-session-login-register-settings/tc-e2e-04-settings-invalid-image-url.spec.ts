// spec: specs/plan.md
// seed: tests/e2e/seed.spec.ts

import { test, expect } from '@playwright/test';

const FIXTURE_USER = {
  email: 'playwright_fixture@example.com',
  password: 'Passw0rd!123',
};

test.describe('Settings (logged in)', () => {
  test('TC-E2E-04 - Settings update rejected or handled with an invalid image URL', async ({ page }) => {
    // 1. Precondition: log in as the fixture account via /login. Navigate to /settings.
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Email' }).fill(FIXTURE_USER.email);
    await page.getByRole('textbox', { name: 'Password' }).fill(FIXTURE_USER.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/(?!login).*/);

    await page.goto('/settings');

    // 2. Fill the Image URL textbox with the non-URL string 'not-a-valid-url', leaving other fields blank.
    const imageUrlInput = page.getByRole('textbox', { name: 'Image URL' });
    await imageUrlInput.fill('not-a-valid-url');

    // 3. Click 'Update Settings' and observe the result, capturing the PUT /api/user response status via waitForResponse.
    const putUserResponsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/user') && response.request().method() === 'PUT'
    );
    await page.getByRole('button', { name: 'Update Settings' }).click();
    const putUserResponse = await putUserResponsePromise;
    const status = putUserResponse.status();

    // Predictable-handling assertion: status must be a defined HTTP status (either branch acceptable).
    expect(status).toBeGreaterThanOrEqual(200);
    expect(status).toBeLessThan(600);

    const errorsList = page.getByRole('list', { name: 'errors' });
    const errorsVisible = await errorsList.isVisible().catch(() => false);

    // TC-E2E-04 traceability: observed PUT /api/user status and whether an errors list appeared.
    // Observed in exploration run: status 200 (request accepted), no 'errors' list appeared —
    // the app redirected away from /settings, confirming the invalid image URL was accepted/ignored
    // per contract rather than rejected. Either branch (2xx accepted OR visible errors list) is valid.
    if (status >= 200 && status < 300) {
      expect(errorsVisible).toBe(false);
    } else {
      expect(errorsVisible).toBe(true);
    }

    // Regardless of branch, the app does not crash: settings form remains rendered and usable afterward.
    await page.goto('/settings');
    await expect(page.getByRole('textbox', { name: 'Bio' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Bio' })).toBeEnabled();
    await expect(imageUrlInput).toBeVisible();
    await expect(imageUrlInput).toBeEnabled();
    await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Email' })).toBeEnabled();
    await expect(page.getByRole('textbox', { name: 'New password (leave blank to keep)' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'New password (leave blank to keep)' })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Update Settings' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Update Settings' })).toBeEnabled();
  });
});
