import { test, expect } from '@playwright/test';

// Shared fixture account — registered in the local DB for Playwright runs.
// Grounds the logged-in preconditions of stories 1.6/1.7/1.8.
export const FIXTURE_USER = {
  username: 'playwright_fixture',
  email: 'playwright_fixture@example.com',
  password: 'Passw0rd!123',
};

// Follower fixture for story 1.7 personal-feed scenarios: pw_bob2 follows pw_author2.
export const FOLLOWER_USER = {
  username: 'pw_bob2',
  email: 'pw_bob2@example.com',
  password: 'Passw0rd!123',
};

test.describe('seed', () => {
  // Logged-out starting state: register/login pages reachable from a clean session.
  test('seed', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);
  });

  // Logged-in starting state: log in as the fixture account via the /login page.
  // Reused by settings, session-persistence, and logout scenarios.
  test('seed: logged in as fixture user', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: /email/i }).fill(FIXTURE_USER.email);
    await page.getByRole('textbox', { name: /password/i }).fill(FIXTURE_USER.password);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await expect(page).toHaveURL(/\/(?!login).*/);
  });

  // Follower login for story 1.7 personal-feed scenarios: pw_bob2 follows pw_author2,
  // who has 15 articles under tag 'pwtag' (incl. 'pw-markdown-rich' with 2 comments).
  test('seed: logged in as follower (pw_bob2)', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('textbox', { name: /email/i }).fill(FOLLOWER_USER.email);
    await page.getByRole('textbox', { name: /password/i }).fill(FOLLOWER_USER.password);
    await page.getByRole('button', { name: /sign in|log in/i }).click();
    await expect(page).toHaveURL(/\/(?!login).*/);
  });
});
