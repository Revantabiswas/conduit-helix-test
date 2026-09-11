// spec: specs/plan.md
// seed: tests/e2e/seed.spec.ts

import { test, expect, type ConsoleMessage } from '@playwright/test';
import { FOLLOWER_USER } from '../seed.spec';

const HYDRATION_ERROR_PATTERN =
  /hydrat|did not match|Text content does not match|Hydration failed|server-rendered HTML/i;

test.describe('Hydration Correctness', () => {
  test('TC-PERF-03 - Both pages render with zero hydration errors in the browser console', async ({ page }) => {
    // 1. Attach a console listener capturing all console messages (page.on('console')) and
    // page errors (page.on('pageerror')) BEFORE navigating.
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    let totalConsoleErrorCount = 0;

    page.on('console', (msg: ConsoleMessage) => {
      if (msg.type() === 'error') {
        totalConsoleErrorCount += 1;
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
    });

    // 2. Anonymous: navigate to / and to /article/pw-markdown-rich. Wait for network idle / load to settle.
    await page.goto('/', { waitUntil: 'load' });
    await expect(page.locator('a[href^="/article/"]').first()).toBeVisible();

    await page.goto('/article/pw-markdown-rich', { waitUntil: 'load' });
    await expect(page.getByRole('heading', { name: 'PW Markdown Rich' })).toBeVisible();

    // 3. Assert NO captured console message of type 'error' (and no pageerror) whose text matches
    // hydration patterns. Any such message is a candidate defect — assert there are zero.
    const anonymousHydrationConsoleErrors = consoleErrors.filter((text) => HYDRATION_ERROR_PATTERN.test(text));
    const anonymousHydrationPageErrors = pageErrors.filter((text) => HYDRATION_ERROR_PATTERN.test(text));
    expect(anonymousHydrationConsoleErrors, 'Anonymous: no hydration-pattern console errors expected').toHaveLength(0);
    expect(anonymousHydrationPageErrors, 'Anonymous: no hydration-pattern page errors expected').toHaveLength(0);

    // 4. Log in as pw_bob2, navigate to / (and /?feed=personal) and to /article/pw-markdown-rich;
    // continue capturing console. Assert still zero hydration errors.
    await page.goto('/login', { waitUntil: 'load' });
    await page.getByRole('textbox', { name: 'Email' }).fill(FOLLOWER_USER.email);
    await page.getByRole('textbox', { name: 'Password' }).fill(FOLLOWER_USER.password);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page).toHaveURL(/\/(?!login).*/);

    await page.goto('/', { waitUntil: 'load' });
    await expect(page.locator('a[href^="/article/"]').first()).toBeVisible();

    await page.goto('/?feed=personal', { waitUntil: 'load' });

    await page.goto('/article/pw-markdown-rich', { waitUntil: 'load' });
    await expect(page.getByRole('heading', { name: 'PW Markdown Rich' })).toBeVisible();

    const loggedInHydrationConsoleErrors = consoleErrors.filter((text) => HYDRATION_ERROR_PATTERN.test(text));
    const loggedInHydrationPageErrors = pageErrors.filter((text) => HYDRATION_ERROR_PATTERN.test(text));
    expect(loggedInHydrationConsoleErrors, 'Logged in: no hydration-pattern console errors expected').toHaveLength(0);
    expect(loggedInHydrationPageErrors, 'Logged in: no hydration-pattern page errors expected').toHaveLength(0);

    // 5. Record the total count of console errors seen (and any non-hydration errors) for
    // traceability, but only FAIL on hydration-pattern errors.
    // Total console errors observed across the whole flow: totalConsoleErrorCount
    // (e.g. non-hydration 404 resource errors such as a missing avatar image are expected and non-blocking).
    // Non-hydration console errors captured: consoleErrors filtered out above.
  });
});
