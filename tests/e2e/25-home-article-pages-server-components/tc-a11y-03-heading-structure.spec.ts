// spec: specs/plan.md
// seed: tests/e2e/seed.spec.ts

import { test, expect } from '@playwright/test';

// WCAG 1.3.1 Info and Relationships. Verifies the home page heading structure is
// present (at least one h1) and hierarchical (no skipped levels going down, e.g.
// no h3 before any h2, no jump from h1 directly to h3).

test.describe('Accessibility', () => {
  test('TC-A11Y-03 - Home page heading structure is present and hierarchical', async ({ page }) => {
    // 1. Navigate to /.
    await page.goto('/');

    // 2. Collect the heading elements and their levels via a read-only locator.evaluateAll.
    const headingLevels = await page
      .locator('h1,h2,h3,h4,h5,h6')
      .evaluateAll((headings) => headings.map((h) => parseInt(h.tagName.substring(1), 10)));

    // 3. Assert there is at least one h1 (page has a top-level heading).
    expect(headingLevels).toContain(1);

    // 4. Assert the heading hierarchy does not skip levels going down: each heading's
    // level is at most (max level seen so far + 1).
    let maxLevelSeen = 0;
    for (const level of headingLevels) {
      expect(level).toBeLessThanOrEqual(maxLevelSeen + 1);
      maxLevelSeen = Math.max(maxLevelSeen, level);
    }

    // 5. Observed heading structure (traceability): the home page renders 11 x <h1>
    // elements — the site title/brand heading ("conduit helix aire test") followed by
    // one <h1> per article preview title (e.g. "PW Markdown Rich", "PW Seed Article 13"
    // through "PW Seed Article 5"). No h2-h6 elements are present. The structure is
    // flat (all headings at level 1), so by definition no level is skipped, and at
    // least one h1 is present.
  });
});
