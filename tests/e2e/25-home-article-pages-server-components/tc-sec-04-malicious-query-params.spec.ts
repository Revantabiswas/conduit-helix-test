// spec: Session-Scoped Rendering
// seed: tests/e2e/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Session-Scoped Rendering', () => {
  test('TC-SEC-04 - Tag/page search params handled safely (injection-style input)', async ({ page }) => {
    // 1. Register a page dialog handler that FAILS the test if any dialog (alert/confirm/prompt) fires.
    let dialogFired = false;
    page.on('dialog', (dialog) => {
      dialogFired = true;
      void dialog.dismiss();
    });

    const serverErrorPattern = /internal server error|stack trace|at Object\.|500/i;

    // 2. Navigate to /?tag=<script>alert(1)</script>&page=-5.
    await page.goto('/?tag=%3Cscript%3Ealert(1)%3C%2Fscript%3E&page=-5');

    // Assert: the page renders without crashing — feed area shows "No articles available." and the
    // app header/chrome is present. No raw server error / stack trace text visible. No 500.
    await expect(page.getByText('No articles available.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign up' })).toBeVisible();
    await expect(page.locator('body')).not.toContainText(serverErrorPattern);
    expect(dialogFired).toBe(false);

    // 3. Navigate to /?tag=pwtag&page=99999 (huge out-of-range page).
    await page.goto('/?tag=pwtag&page=99999');

    // Assert: no crash; graceful empty state or no articles; header present; no server error/stack trace.
    await expect(page.getByText('No articles available.')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
    await expect(page.locator('body')).not.toContainText(serverErrorPattern);
    expect(dialogFired).toBe(false);

    // 4. Navigate to /?tag=pwtag&page=-5 (negative page).
    await page.goto('/?tag=pwtag&page=-5');

    // Assert: no crash; graceful handling; no server error.
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Global Feed' })).toBeVisible();
    await expect(page.locator('body')).not.toContainText(serverErrorPattern);

    // 5. Final: assert zero dialogs fired during the whole test.
    expect(dialogFired).toBe(false);
  });
});
