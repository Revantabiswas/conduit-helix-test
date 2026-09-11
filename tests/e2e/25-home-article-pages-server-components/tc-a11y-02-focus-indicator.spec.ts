// spec: specs/plan.md
// seed: tests/e2e/seed.spec.ts

import { test, expect } from '@playwright/test';

// WCAG 2.4.7 Focus Visible. VERIFIED baseline: links use browser-default outline
// (outline: auto ~5px), not suppressed. Asserts a visible focus indicator exists
// (outline-style !== 'none' AND outline-width !== '0px', OR a non-none box-shadow)
// for a representative set of links and tags on the home page (anonymous).
function hasVisibleFocusIndicator(style: { outlineStyle: string; outlineWidth: string; boxShadow: string }) {
  const hasOutline = style.outlineStyle !== 'none' && style.outlineWidth !== '0px';
  const hasBoxShadow = style.boxShadow !== 'none';
  return hasOutline || hasBoxShadow;
}

test.describe('Accessibility', () => {
  test('TC-A11Y-02 - Home page visible focus indicator on links and tags', async ({ page }) => {
    // 1. Navigate to /.
    await page.goto('/');

    // 2. Focus a representative set of interactive controls — a nav link, an article
    // preview link, and a popular-tag link — and assert each has a visible focus indicator.

    // Nav link: Home.
    const homeLink = page.getByRole('link', { name: 'Home' });
    await homeLink.evaluate((el: HTMLElement) => {
      el.focus();
      return document.activeElement === el;
    });
    await expect(homeLink).toBeFocused();
    const homeLinkFocusStyle = await homeLink.evaluate((el: HTMLElement) => {
      const s = getComputedStyle(el);
      return { outlineStyle: s.outlineStyle, outlineWidth: s.outlineWidth, boxShadow: s.boxShadow };
    });
    expect(hasVisibleFocusIndicator(homeLinkFocusStyle)).toBe(true);

    // Article preview link.
    const articleLink = page.getByRole('link', { name: 'PW Markdown Rich rich md Read' });
    await articleLink.evaluate((el: HTMLElement) => {
      el.focus();
      return document.activeElement === el;
    });
    await expect(articleLink).toBeFocused();
    const articleLinkFocusStyle = await articleLink.evaluate((el: HTMLElement) => {
      const s = getComputedStyle(el);
      return { outlineStyle: s.outlineStyle, outlineWidth: s.outlineWidth, boxShadow: s.boxShadow };
    });
    expect(hasVisibleFocusIndicator(articleLinkFocusStyle)).toBe(true);

    // Popular-tag link.
    const pwtagLink = page.getByRole('link', { name: 'pwtag', exact: true });
    await pwtagLink.evaluate((el: HTMLElement) => {
      el.focus();
      return document.activeElement === el;
    });
    await expect(pwtagLink).toBeFocused();
    const pwtagLinkFocusStyle = await pwtagLink.evaluate((el: HTMLElement) => {
      const s = getComputedStyle(el);
      return { outlineStyle: s.outlineStyle, outlineWidth: s.outlineWidth, boxShadow: s.boxShadow };
    });
    expect(hasVisibleFocusIndicator(pwtagLinkFocusStyle)).toBe(true);

    // 3. Control types checked: nav link (Home), article preview link (a[href^="/article/"]),
    // popular-tag link (a[href^="/?tag="]).
  });
});
