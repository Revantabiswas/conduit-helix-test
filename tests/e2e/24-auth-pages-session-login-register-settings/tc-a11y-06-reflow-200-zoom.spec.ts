// spec: WCAG 1.4.4 Resize Text, 1.4.10 Reflow - Accessibility (DOM-observable)
// seed: tests/e2e/seed.spec.ts

import { test, expect, type Page } from '@playwright/test';

const FIXTURE_USER = {
  email: 'playwright_fixture@example.com',
  password: 'Passw0rd!123',
};

// Small tolerance for sub-pixel rounding when comparing scrollWidth/clientWidth.
const OVERFLOW_TOLERANCE_PX = 2;

// Read-only check that the document does not overflow horizontally at the
// current viewport (WCAG 1.4.10 Reflow).
async function expectNoHorizontalOverflow(page: Page, context: string) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(
    scrollWidth,
    `${context}: document.documentElement.scrollWidth (${scrollWidth}) should not exceed clientWidth (${clientWidth}) + tolerance`
  ).toBeLessThanOrEqual(clientWidth + OVERFLOW_TOLERANCE_PX);
}

test.describe('Accessibility (DOM-observable)', () => {
  test('TC-A11Y-06 - Pages usable at reduced viewport (approx 200% zoom / reflow)', async ({ page }) => {
    // 1. Precondition: logged out. Set the viewport to 640x800 (page.setViewportSize) to
    // approximate 200% zoom / reflow.
    await page.setViewportSize({ width: 640, height: 800 });

    // 2. Navigate to /login.
    await page.goto('/login');

    const loginEmail = page.getByRole('textbox', { name: 'Email' });
    const loginPassword = page.getByRole('textbox', { name: 'Password' });
    const signInButton = page.getByRole('button', { name: 'Sign in' });

    await expect(loginEmail).toBeVisible();
    await expect(loginPassword).toBeVisible();
    await expect(signInButton).toBeVisible();
    await expectNoHorizontalOverflow(page, '/login');

    // 3. Navigate to /register.
    await page.goto('/register');

    const usernameField = page.getByRole('textbox', { name: 'Username' });
    const registerEmail = page.getByRole('textbox', { name: 'Email' });
    const registerPassword = page.getByRole('textbox', { name: 'Password' });
    const signUpButton = page.getByRole('button', { name: 'Sign up' });

    await expect(usernameField).toBeVisible();
    await expect(registerEmail).toBeVisible();
    await expect(registerPassword).toBeVisible();
    await expect(signUpButton).toBeVisible();
    await expectNoHorizontalOverflow(page, '/register');

    // 4. Log in as the fixture account, navigate to /settings.
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Email' }).fill(FIXTURE_USER.email);
    await page.getByRole('textbox', { name: 'Password' }).fill(FIXTURE_USER.password);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await page.goto('/settings');

    const bioField = page.getByRole('textbox', { name: 'Bio' });
    const imageUrlField = page.getByRole('textbox', { name: 'Image URL' });
    const settingsEmail = page.getByRole('textbox', { name: 'Email' });
    const newPasswordField = page.getByRole('textbox', { name: 'New password (leave blank to keep)' });
    const updateSettingsButton = page.getByRole('button', { name: 'Update Settings' });
    const logOutButton = page.getByRole('button', { name: 'Log out' });

    await expect(bioField).toBeVisible();
    await expect(imageUrlField).toBeVisible();
    await expect(settingsEmail).toBeVisible();
    await expect(newPasswordField).toBeVisible();
    await expect(updateSettingsButton).toBeVisible();
    await expect(logOutButton).toBeVisible();
    await expectNoHorizontalOverflow(page, '/settings');
  });
});
