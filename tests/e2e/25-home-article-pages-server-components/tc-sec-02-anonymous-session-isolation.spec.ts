// spec: Session-Scoped Rendering
// seed: tests/e2e/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Session-Scoped Rendering', () => {
  test('TC-SEC-02 - Anonymous visitor is treated as unauthenticated (no session-specific state leaks)', async ({ page, context }) => {
    // 1. Navigate to / (home).
    await page.goto('/');

    // Assert: the header shows anonymous affordances — 'Sign in' and 'Sign up' links visible;
    // NO 'Settings'/'New Article'/username link (no logged-in state).
    const nav = page.locator('nav');
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible();
    await expect(nav.getByText('Settings', { exact: false })).toHaveCount(0);
    await expect(nav.getByText('New Article', { exact: false })).toHaveCount(0);

    // 2. Navigate to /article/pw-markdown-rich.
    await page.goto('/article/pw-markdown-rich');

    // Assert: header still anonymous (Sign in / Sign up visible).
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible();

    // Assert: no logged-in-only / per-user affordance reflecting another user's state is present —
    // no button elements at all on the article page reflecting favorite/follow state.
    await expect(page.locator('button')).toHaveCount(0);

    // Assert: the article content (title, body, comments) still renders.
    await expect(page.getByRole('heading', { name: 'PW Markdown Rich' })).toBeVisible();

    // 3. Confirm no session cookie exists for the anonymous context (context.cookies() has no conduit_token).
    const cookies = await context.cookies();
    expect(cookies.find((cookie) => cookie.name === 'conduit_token')).toBeUndefined();
  });
});
