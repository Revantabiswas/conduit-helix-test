import { defineConfig, devices } from '@playwright/test';

// AIRE convention: testDir is ./tests/e2e so seed.spec.ts and every generated
// story spec live under tests/e2e/. baseURL points at the locally running
// Next.js app (System Under Test) for stories 1.6/1.7/1.8.
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
