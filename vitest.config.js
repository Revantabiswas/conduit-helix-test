import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "frontend/src/setupTests.js",
    css: true,
    // Scope to the legacy frontend/backend test suites (their original de-facto scope).
    // The migrated src/ app has its own node-environment runner (vitest.src.config.js),
    // so its tests must not be pulled into this jsdom config.
    include: ["frontend/**/*.test.{js,jsx}", "backend/**/*.test.{js,jsx}"],
  },
});
