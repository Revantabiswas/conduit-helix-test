// spec: specs/plan.md
// seed: tests/e2e/seed.spec.ts

import { test, expect } from '@playwright/test';

const FIXTURE_USER = {
  email: 'playwright_fixture@example.com',
  password: 'Passw0rd!123',
  username: 'playwright_fixture',
};

test.describe('Settings (logged in)', () => {
  test('TC-E2E-03 - Log in, update Settings, and see the change persist', async ({ page }) => {
    // 1. Precondition: log in as the fixture account via /login (go to /login, fill Email/Password, click 'Sign in', wait for redirect off /login).
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Email' }).fill(FIXTURE_USER.email);
    await page.getByRole('textbox', { name: 'Password' }).fill(FIXTURE_USER.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/(?!login).*/);

    // The post-login redirect lands on '/', but the session cookie write and the client's
    // logged-in state can still be settling at this instant. Wait for a logged-in header
    // affordance before navigating on — otherwise an immediate `page.goto('/settings')` can race
    // the cookie, occasionally causing the subsequent PUT /api/user to be sent unauthenticated
    // (observed intermittently as a 401).
    await expect(page.getByRole('link', { name: FIXTURE_USER.username })).toBeVisible();

    // 2. Navigate to /settings. Expect: heading 'Your Settings' visible; Bio/Image URL/Email/New password textboxes present (render empty by design — do not assert their values).
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: 'Your Settings' })).toBeVisible();
    const bioInput = page.getByRole('textbox', { name: 'Bio' });
    const imageUrlInput = page.getByRole('textbox', { name: 'Image URL' });
    const emailInput = page.getByRole('textbox', { name: 'Email' });
    const newPasswordInput = page.getByRole('textbox', { name: 'New password (leave blank to keep)' });
    await expect(bioInput).toBeVisible();
    await expect(imageUrlInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(newPasswordInput).toBeVisible();

    // 3. Fill Bio with 'Updated bio via E2E' and Image URL with 'https://example.com/avatar.png'. Do NOT modify Email or New password (leave blank) so the fixture login credentials stay unchanged.
    await bioInput.fill('Updated bio via E2E');
    await imageUrlInput.fill('https://example.com/avatar.png');

    // 4. Click 'Update Settings' and wait for the PUT /api/user network response.
    // Expect: PUT /api/user returns a 2xx status; no 'errors' list appears; navigation redirects away from /settings (observed: to /).
    const putUserResponsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/user') && response.request().method() === 'PUT'
    );
    await page.getByRole('button', { name: 'Update Settings' }).click();
    const putUserResponse = await putUserResponsePromise;
    expect(putUserResponse.status()).toBeGreaterThanOrEqual(200);
    expect(putUserResponse.status()).toBeLessThan(300);
    await expect(page.getByText('errors', { exact: false })).not.toBeVisible();
    await expect(page).toHaveURL(/\/(?!settings).*/);

    // 5. Navigate to /profile/playwright_fixture to verify the persisted change.
    // Expect: the profile page displays the bio text 'Updated bio via E2E'.
    await page.goto(`/profile/${FIXTURE_USER.username}`);
    await expect(page.getByText('Updated bio via E2E')).toBeVisible();

    // 6. Navigate back to /settings and reload.
    // Expect: settings form remains usable (Bio/Image URL/Email/New password present, no errors) — app not left broken.
    await page.goto('/settings');
    await page.reload();
    await expect(page.getByRole('textbox', { name: 'Bio' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Image URL' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'New password (leave blank to keep)' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Update Settings' })).toBeVisible();
  });
});
