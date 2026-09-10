// Vitest config for React component tests (Story 1.9). jsdom environment + React plugin,
// separate from the node-env service/API suite (vitest.src.config.js).
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    include: ["tests/components/**/*.test.jsx"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      reportsDirectory: "coverage/components",
      include: ["src/components/**/*.jsx"],
      // Navbar is an async Server Component that reads the DB-backed session; it is
      // exercised via the end-to-end behaviour journeys, not jsdom RTL. Exclude it from
      // the RTL coverage denominator (the presentational components are what RTL covers).
      exclude: ["src/components/Navbar.jsx"],
    },
  },
});
