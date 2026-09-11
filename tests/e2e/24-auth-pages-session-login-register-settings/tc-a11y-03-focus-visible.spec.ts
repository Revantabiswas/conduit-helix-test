// spec: WCAG 2.4.7 Focus Visible - Accessibility (DOM-observable)
// seed: tests/e2e/seed.spec.ts

import { test, expect, type Locator, type Page } from '@playwright/test';

const FIXTURE_USER = {
  email: 'playwright_fixture@example.com',
  password: 'Passw0rd!123',
};

type FocusStyle = {
  tag: string;
  outline: string;
  outlineWidth: string;
  boxShadow: string;
  border: string;
};

// Tabs to the next control, asserts it is the expected locator, and returns its
// computed focus style so the caller can assert a visible focus indicator (WCAG 2.4.7).
async function tabAndCheckFocus(page: Page, expected: Locator): Promise<FocusStyle> {
  await page.keyboard.press('Tab');
  await expect(expected).toBeFocused();
  return expected.evaluate((el) => {
    const cs = getComputedStyle(el);
    return {
      tag: el.tagName,
      outline: cs.outline,
      outlineWidth: cs.outlineWidth,
      boxShadow: cs.boxShadow,
      border: cs.border,
    };
  });
}

function hasVisibleFocusIndicator(style: FocusStyle): boolean {
  const hasOutline = style.outlineWidth !== '0px' && !style.outline.includes('none');
  const hasBoxShadow = style.boxShadow !== 'none';
  return hasOutline || hasBoxShadow;
}

test.describe('Accessibility (DOM-observable)', () => {
  test('TC-A11Y-03 - Focus is visible on every interactive control (links and inputs)', async ({ page }) => {
    // 1. Precondition: logged out. Navigate to /login. Tab sequentially through the interactive
    // controls (nav links, then Email, Password). After focusing each form control,
    // assert it is focused AND that a visible focus indicator is present.
    // NOTE: button focus-visibility assertions (Sign in, Sign up, Update Settings, Log out) are
    // split into a separate, currently test.fixme()'d test below — see comment there for why.
    await page.goto('/login');

    const logoLink = page.getByRole('link', { name: 'conduit helix aire test' }).first();
    const homeLink = page.getByRole('link', { name: 'Home' });
    const signInNavLink = page.getByRole('link', { name: 'Sign in' });
    const signUpNavLink = page.getByRole('link', { name: 'Sign up' });
    const loginEmail = page.getByRole('textbox', { name: 'Email' });
    const loginPassword = page.getByRole('textbox', { name: 'Password' });

    let style = await tabAndCheckFocus(page, logoLink);
    expect(hasVisibleFocusIndicator(style), 'logo link should have a visible focus indicator').toBe(true);

    style = await tabAndCheckFocus(page, homeLink);
    expect(hasVisibleFocusIndicator(style), 'Home nav link should have a visible focus indicator').toBe(true);

    style = await tabAndCheckFocus(page, signInNavLink);
    expect(hasVisibleFocusIndicator(style), 'Sign in nav link should have a visible focus indicator').toBe(true);

    style = await tabAndCheckFocus(page, signUpNavLink);
    expect(hasVisibleFocusIndicator(style), 'Sign up nav link should have a visible focus indicator').toBe(true);

    style = await tabAndCheckFocus(page, loginEmail);
    expect(hasVisibleFocusIndicator(style), 'Email field (login) should have a visible focus indicator').toBe(true);

    style = await tabAndCheckFocus(page, loginPassword);
    expect(hasVisibleFocusIndicator(style), 'Password field (login) should have a visible focus indicator').toBe(true);

    // 2. Navigate to /register, repeat the tab-through-and-check-focus-style for
    // Username, Email, Password.
    await page.goto('/register');

    const regLogoLink = page.getByRole('link', { name: 'conduit helix aire test' }).first();
    const regHomeLink = page.getByRole('link', { name: 'Home' });
    const regSignInNavLink = page.getByRole('link', { name: 'Sign in' });
    const regSignUpNavLink = page.getByRole('link', { name: 'Sign up' });
    const usernameField = page.getByRole('textbox', { name: 'Username' });
    const registerEmail = page.getByRole('textbox', { name: 'Email' });
    const registerPassword = page.getByRole('textbox', { name: 'Password' });

    await tabAndCheckFocus(page, regLogoLink);
    await tabAndCheckFocus(page, regHomeLink);
    await tabAndCheckFocus(page, regSignInNavLink);
    await tabAndCheckFocus(page, regSignUpNavLink);

    style = await tabAndCheckFocus(page, usernameField);
    expect(hasVisibleFocusIndicator(style), 'Username field should have a visible focus indicator').toBe(true);

    style = await tabAndCheckFocus(page, registerEmail);
    expect(hasVisibleFocusIndicator(style), 'Email field (register) should have a visible focus indicator').toBe(true);

    style = await tabAndCheckFocus(page, registerPassword);
    expect(hasVisibleFocusIndicator(style), 'Password field (register) should have a visible focus indicator').toBe(true);

    // 3. Log in as the fixture account, navigate to /settings, repeat for Bio, Image URL, Email,
    // New password.
    await page.goto('/login');
    await page.getByRole('textbox', { name: 'Email' }).fill(FIXTURE_USER.email);
    await page.getByRole('textbox', { name: 'Password' }).fill(FIXTURE_USER.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/(?!login).*/);
    // The post-login redirect can land before the logged-in header state (cookie/client state)
    // has fully settled. Wait for a logged-in-only affordance before navigating on, otherwise
    // /settings can render mid-transition and "New Article" is briefly absent from the header.
    await expect(page.getByRole('link', { name: 'playwright_fixture' })).toBeVisible();

    await page.goto('/settings');

    const settingsLogoLink = page.getByRole('link', { name: 'conduit helix aire test' }).first();
    const settingsHomeLink = page.getByRole('link', { name: 'Home' });
    const newArticleLink = page.getByRole('link', { name: 'New Article' });
    const settingsNavLink = page.getByRole('link', { name: 'Settings' });
    const profileLink = page.getByRole('link', { name: 'playwright_fixture' });
    const bioField = page.getByRole('textbox', { name: 'Bio' });
    const imageUrlField = page.getByRole('textbox', { name: 'Image URL' });
    const settingsEmail = page.getByRole('textbox', { name: 'Email' });
    const newPasswordField = page.getByRole('textbox', { name: 'New password (leave blank to keep)' });

    await expect(newArticleLink).toBeVisible();
    await tabAndCheckFocus(page, settingsLogoLink);
    await tabAndCheckFocus(page, settingsHomeLink);
    await tabAndCheckFocus(page, newArticleLink);
    await tabAndCheckFocus(page, settingsNavLink);
    await tabAndCheckFocus(page, profileLink);

    style = await tabAndCheckFocus(page, bioField);
    expect(hasVisibleFocusIndicator(style), 'Bio field should have a visible focus indicator').toBe(true);

    style = await tabAndCheckFocus(page, imageUrlField);
    expect(hasVisibleFocusIndicator(style), 'Image URL field should have a visible focus indicator').toBe(true);

    style = await tabAndCheckFocus(page, settingsEmail);
    expect(hasVisibleFocusIndicator(style), 'Email field (settings) should have a visible focus indicator').toBe(true);

    style = await tabAndCheckFocus(page, newPasswordField);
    expect(hasVisibleFocusIndicator(style), 'New password field should have a visible focus indicator').toBe(true);
  });

  // CANDIDATE PRODUCT DEFECT (not a test flaw) — WCAG 2.4.7 Focus Visible.
  // Investigation confirmed the app's <button> elements (Sign in, Sign up, Update Settings,
  // Log out) are rendered with `outline: none` (via Bootstrap's `.btn` styling) and have no
  // alternative visible focus style (no box-shadow, no border change) applied on :focus.
  // This means keyboard users cannot see which button is focused, a genuine WCAG 2.4.7
  // violation. This is an application defect, not a test bug — route to raise-defect.
  test.fixme(
    'TC-A11Y-03 - Buttons (Sign in, Sign up, Update Settings, Log out) show a visible focus indicator (WCAG 2.4.7)',
    async ({ page }) => {
      await page.goto('/login');

      const loginEmail = page.getByRole('textbox', { name: 'Email' });
      const loginPassword = page.getByRole('textbox', { name: 'Password' });
      const signInButton = page.getByRole('button', { name: 'Sign in' });

      await loginEmail.focus();
      let style = await tabAndCheckFocus(page, loginPassword);
      style = await tabAndCheckFocus(page, signInButton);
      expect(hasVisibleFocusIndicator(style), 'Sign in button should have a visible focus indicator (WCAG 2.4.7)').toBe(true);

      await page.goto('/register');
      const usernameField = page.getByRole('textbox', { name: 'Username' });
      const registerEmail = page.getByRole('textbox', { name: 'Email' });
      const registerPassword = page.getByRole('textbox', { name: 'Password' });
      const signUpButton = page.getByRole('button', { name: 'Sign up' });

      await usernameField.focus();
      await tabAndCheckFocus(page, registerEmail);
      await tabAndCheckFocus(page, registerPassword);
      style = await tabAndCheckFocus(page, signUpButton);
      expect(hasVisibleFocusIndicator(style), 'Sign up button should have a visible focus indicator (WCAG 2.4.7)').toBe(true);

      await page.goto('/login');
      await page.getByRole('textbox', { name: 'Email' }).fill(FIXTURE_USER.email);
      await page.getByRole('textbox', { name: 'Password' }).fill(FIXTURE_USER.password);
      await page.getByRole('button', { name: 'Sign in' }).click();
      await expect(page).toHaveURL(/\/(?!login).*/);
      await expect(page.getByRole('link', { name: 'playwright_fixture' })).toBeVisible();

      await page.goto('/settings');
      const newPasswordField = page.getByRole('textbox', { name: 'New password (leave blank to keep)' });
      const updateSettingsButton = page.getByRole('button', { name: 'Update Settings' });
      const logOutButton = page.getByRole('button', { name: 'Log out' });

      await newPasswordField.focus();
      style = await tabAndCheckFocus(page, updateSettingsButton);
      expect(hasVisibleFocusIndicator(style), 'Update Settings button should have a visible focus indicator (WCAG 2.4.7)').toBe(true);

      style = await tabAndCheckFocus(page, logOutButton);
      expect(hasVisibleFocusIndicator(style), 'Log out button should have a visible focus indicator (WCAG 2.4.7)').toBe(true);
    }
  );
});
