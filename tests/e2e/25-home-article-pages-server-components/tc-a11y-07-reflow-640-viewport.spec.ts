// spec: specs/plan.md
// seed: tests/e2e/seed.spec.ts

import { test, expect } from '@playwright/test';

// WCAG 1.4.4 Resize Text, 1.4.10 Reflow. Approximates 200% zoom via a reduced
// 640x800 viewport and confirms both the home page and an article page reflow
// their content without introducing horizontal overflow.

test.describe('Accessibility', () => {
  test('TC-A11Y-07 - Both pages reflow at reduced viewport with no horizontal overflow', async ({
    page,
  }) => {
    // 1. Set viewport to 640x800 (page.setViewportSize).
    await page.setViewportSize({ width: 640, height: 800 });

    // 2. Navigate to / (home).
    await page.goto('/');

    // Assert: key content is visible — at least one article preview link visible,
    // the popular-tags sidebar / a tag link visible, nav present.
    await expect(page.getByRole('navigation')).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'PW Markdown Rich rich md Read' })
    ).toBeVisible();
    await expect(page.locator('a[href="/?tag=pwtag"]')).toBeVisible();

    // Assert: no horizontal overflow of the document — scrollWidth <= clientWidth
    // + 2px tolerance (read-only evaluate).
    const homeDimensions = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(homeDimensions.scrollWidth).toBeLessThanOrEqual(homeDimensions.clientWidth + 2);

    // 3. Navigate to /article/pw-markdown-rich.
    await page.goto('/article/pw-markdown-rich');

    // Assert: article title/body visible; no horizontal overflow (same
    // scrollWidth<=clientWidth+2 check).
    await expect(page.getByRole('heading', { name: 'PW Markdown Rich' })).toBeVisible();

    const articleDimensions = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(articleDimensions.scrollWidth).toBeLessThanOrEqual(
      articleDimensions.clientWidth + 2
    );

    // 4. Observed dimensions (traceability, captured at 640x800 viewport):
    // Home page — scrollWidth/clientWidth recorded above via homeDimensions.
    // Article page — scrollWidth/clientWidth recorded above via articleDimensions.
    // Both pages are expected to reflow to the 640px width with no horizontal
    // scrollbar (scrollWidth effectively equal to clientWidth, within the 2px
    // tolerance for sub-pixel rendering).
  });
});
