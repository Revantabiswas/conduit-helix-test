// Vitest config for the migrated Next.js app under src/ (Story 1.1+).
// Separate from the legacy root vitest.config.js (which targets the old frontend/ with jsdom).
// These tests run in the node environment and cover src/ + tests/unit.
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["tests/unit/**/*.test.js", "tests/api/**/*.test.js"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "json"],
      reportsDirectory: "coverage/src",
      include: ["src/lib/**/*.js"],
      // App Router UI files (layout/page) are exercised by RTL/e2e in later stories,
      // not unit-tested here — exclude from this story's coverage denominator.
      exclude: ["src/app/**"],
    },
  },
});
