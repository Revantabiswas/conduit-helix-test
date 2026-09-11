// spec: specs/plan.md
// seed: tests/e2e/seed.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Home Feed and Navigation', () => {
  test('TC-E2E-03 - Filter feed by tag via URL, then open an article and read body + comments', async ({
    page,
  }) => {
    // 1. Navigate to /. In the popular-tags sidebar, click the 'pwtag' tag link.
    await page.goto('/');
    await page.getByRole('link', { name: 'pwtag', exact: true }).click();

    // 2. Assert the URL now contains tag=pwtag (a navigation).
    await expect(page).toHaveURL(/[?&]tag=pwtag/);

    // 3. Assert the feed re-rendered to pwtag-filtered articles (assert multiple article preview cards are visible).
    await expect(page.getByRole('heading', { name: 'PW Markdown Rich' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'PW Seed Article 13' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'PW Seed Article 12' })).toBeVisible();

    // 4. Navigate to the article: go to /article/pw-markdown-rich (or click its preview).
    await page.goto('/article/pw-markdown-rich');

    // 5. Assert the article body renders as FORMATTED HTML, not raw markdown: assert a heading element
    // (from '# Heading'), a bold/strong element (from '**bold**'), a list (ul/li items), and a code block
    // (pre/code from the ```js fence) are present in the rendered article body. Do NOT assert raw markdown
    // characters like '#' or '**' appear as literal text.
    await expect(page.getByRole('heading', { name: 'Heading' })).toBeVisible();
    await expect(page.locator('strong', { hasText: 'bold' })).toBeVisible();
    await expect(page.getByRole('listitem').filter({ hasText: 'item one' })).toBeVisible();
    await expect(page.getByRole('listitem').filter({ hasText: 'item two' })).toBeVisible();
    await expect(page.locator('code', { hasText: 'const x = 1;' })).toBeVisible();

    // 6. Assert a comments list is rendered below the article showing the 2 seeded comments (assert two
    // comment items / the two comment bodies are visible).
    await expect(page.getByText('First comment on rich article')).toBeVisible();
    await expect(page.getByText('Second comment here')).toBeVisible();
  });
});
