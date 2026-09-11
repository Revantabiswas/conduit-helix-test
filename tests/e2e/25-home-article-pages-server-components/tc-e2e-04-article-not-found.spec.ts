// spec: Home Feed and Navigation
// seed: tests/e2e/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Home Feed and Navigation', () => {
  test('TC-E2E-04 - Open a non-existent article slug: graceful not-found, not a crash', async ({ page }) => {
    // 1. Navigate to /article/nonexistent-slug-xyz-000.
    const response = await page.goto('/article/nonexistent-slug-xyz-000');
    // Informational only: the app returns HTTP 200 with a rendered not-found UI
    // (NOT a 404 status, NOT a Next.js 404 page) — verified actual status: 200.
    // eslint-disable-next-line no-console
    console.log(`Actual document response status: ${response?.status()}`);

    // 2. Assert a graceful not-found state is shown: a heading or visible text matching /article not found/i is visible.
    await expect(page.getByRole('heading', { name: /article not found/i })).toBeVisible();

    // 3. Assert NO server error / stack trace is exposed: assert no text matching
    //    /internal server error|stack trace|at Object\.|at async|500/i is visible, and the page is not blank
    //    (the app chrome / header still renders).
    await expect(page.getByText(/internal server error|stack trace|at Object\.|at async|500/i)).toHaveCount(0);
    await expect(page.getByRole('navigation')).toBeVisible();
    await expect(page.getByRole('link', { name: 'conduit helix aire test' }).first()).toBeVisible();
  });
});
