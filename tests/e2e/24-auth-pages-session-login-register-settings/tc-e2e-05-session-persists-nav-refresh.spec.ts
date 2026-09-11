// spec: specs/plan.md
// seed: tests/e2e/seed.spec.ts

import { test, expect } from '@playwright/test';

const FIXTURE_USER = {
  email: 'playwright_fixture@example.com',
  password: 'Passw0rd!123',
  username: 'playwright_fixture',
};

test.describe('Session and Logout', () => {
  test('TC-E2E-05 - Session persists across navigation and refresh', async ({ page }) => {
    // 1. Precondition: log in as the fixture account via /login (fill Email/Password, click 'Sign in', wait for redirect off /login).
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Email' }).fill(FIXTURE_USER.email);
    await page.getByRole('textbox', { name: 'Password' }).fill(FIXTURE_USER.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/(?!login).*/);

    const settingsLink = page.getByRole('link', { name: 'Settings' });
    const newArticleLink = page.getByRole('link', { name: 'New Article' });
    const usernameLink = page.getByRole('link', { name: FIXTURE_USER.username });

    // The post-login redirect lands on '/', but the session cookie write and the client's
    // logged-in header state can still be settling at this instant. Wait for the logged-in
    // header affordance to actually appear here (on the page we already landed on) before doing
    // a further full navigation — otherwise a fresh `page.goto('/')` can race the cookie/header
    // and briefly (or, if hydration lags, persistently within the 5s default timeout) render the
    // logged-out header.
    await expect(usernameLink).toBeVisible();

    // 2. Navigate to / (Home). Expect: logged-in header affordances visible (Settings, New Article, playwright_fixture link).
    await page.goto('/');
    await expect(page).not.toHaveURL(/\/login/);
    await expect(settingsLink).toBeVisible();
    await expect(newArticleLink).toBeVisible();
    await expect(usernameLink).toBeVisible();

    // 3. Navigate to /settings. Expect: settings form loads; logged-in header still visible; NOT redirected to /login.
    await page.goto('/settings');
    await expect(page).toHaveURL(/\/settings/);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: 'Your Settings' })).toBeVisible();
    await expect(settingsLink).toBeVisible();
    await expect(newArticleLink).toBeVisible();
    await expect(usernameLink).toBeVisible();

    // 4. Navigate back to /. Expect: logged-in header still visible.
    await page.goto('/');
    await expect(page).not.toHaveURL(/\/login/);
    await expect(settingsLink).toBeVisible();
    await expect(newArticleLink).toBeVisible();
    await expect(usernameLink).toBeVisible();

    // 5. Full page reload (page.reload()) on /. Expect: still logged in — header shows Settings/New Article/username link, not Sign in/Sign up.
    await page.reload();
    await expect(page).not.toHaveURL(/\/login/);
    await expect(settingsLink).toBeVisible();
    await expect(newArticleLink).toBeVisible();
    await expect(usernameLink).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign in' })).not.toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign up' })).not.toBeVisible();

    // 6. Full page reload on /settings. Expect: still logged in — logged-in header; settings form present.
    await page.goto('/settings');
    await page.reload();
    await expect(page).toHaveURL(/\/settings/);
    await expect(page).not.toHaveURL(/\/login/);
    await expect(settingsLink).toBeVisible();
    await expect(newArticleLink).toBeVisible();
    await expect(usernameLink).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Your Settings' })).toBeVisible();
    await expect(page.getByRole('textbox', { name: 'Bio' })).toBeVisible();

    // 7. Confirm no automatic navigation back to /login occurred at any point.
    await expect(page).not.toHaveURL(/\/login/);
  });
});
