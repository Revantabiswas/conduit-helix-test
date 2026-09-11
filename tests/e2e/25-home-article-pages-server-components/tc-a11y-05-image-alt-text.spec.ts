// spec: WCAG 1.1.1 Non-text Content
// seed: tests/e2e/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  test('TC-A11Y-05 - Article page author avatar / content images have alt text', async ({ page }) => {
    // 1. Navigate to /article/pw-markdown-rich.
    await page.goto('/article/pw-markdown-rich');

    // 2. Collect all <img> elements on the page.
    const images = page.locator('img');
    const imageCount = await images.count();

    // 4. If there are zero <img> elements on the page, assert that explicitly (nothing to check) - do not fail.
    if (imageCount === 0) {
      expect(imageCount).toBe(0);
      return;
    }

    // 3. Assert every <img> has an alt ATTRIBUTE PRESENT (value may be meaningful string or empty string for
    //    decorative images). An <img> entirely MISSING the alt attribute is a WCAG 1.1.1 FAIL.
    let imagesWithAlt = 0;
    for (let i = 0; i < imageCount; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt, `img[${i}] must have an alt attribute present (WCAG 1.1.1)`).not.toBeNull();
      if (alt !== null) {
        imagesWithAlt++;
      }
    }

    // 5. Record the count of images and how many had alt.
    // Total images found: 3 (1 author avatar + 2 comment avatars), all 3 had a present alt attribute.
    expect(imagesWithAlt).toBe(imageCount);
  });
});
