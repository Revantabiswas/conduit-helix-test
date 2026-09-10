// spec: Login and Register
// seed: tests/e2e/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Login and Register', () => {
  test('TC-A11Y-01 - Login form fully keyboard operable with logical focus order', async ({ page }) => {
    // 1. Precondition: logged out. Navigate to /login.
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);

    const homeLink = page.getByRole('link', { name: 'Home' });
    const signInNavLink = page.getByRole('link', { name: 'Sign in' });
    const signUpNavLink = page.getByRole('link', { name: 'Sign up' });
    const emailInput = page.getByRole('textbox', { name: 'Email' });
    const passwordInput = page.getByRole('textbox', { name: 'Password' });
    const signInButton = page.getByRole('button', { name: 'Sign in' });

    // 2. Starting from a neutral point, press Tab repeatedly and record the sequence of focused
    // elements until reaching the 'Sign in' button. Verify the FORM fields are focused in the
    // order Email -> Password -> Sign in button (nav links may precede the form; that is
    // acceptable). Verify Tab always advances to a new element (no focus trap) and Shift+Tab
    // moves back.
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'conduit helix aire test' }).first()).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(homeLink).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(signInNavLink).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(signUpNavLink).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(emailInput).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(passwordInput).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(signInButton).toBeFocused();

    // Verify Shift+Tab moves focus back to Password field (no focus trap).
    await page.keyboard.press('Shift+Tab');
    await expect(passwordInput).toBeFocused();

    // Verify Tab always advances to a new element again.
    await page.keyboard.press('Tab');
    await expect(signInButton).toBeFocused();

    // 3. Focus the Email textbox (via tabbing), type email, press Tab to Password, type password.
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Shift+Tab');
    await expect(emailInput).toBeFocused();
    await emailInput.pressSequentially('playwright_fixture@example.com');

    await page.keyboard.press('Tab');
    await expect(passwordInput).toBeFocused();
    await passwordInput.pressSequentially('Passw0rd!123');

    // 4. With focus on the 'Sign in' button reached via Tab (not click), press Enter to submit.
    await page.keyboard.press('Tab');
    await expect(signInButton).toBeFocused();
    await page.keyboard.press('Enter');

    // Expected: Login succeeds via keyboard: URL navigates away from /login.
    await expect(page).not.toHaveURL(/\/login/);

    // Expected: Header shows logged-in affordances (Settings, New Article, username link).
    await expect(page.getByRole('link', { name: 'Settings' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'New Article' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'playwright_fixture' })).toBeVisible();
  });
});
