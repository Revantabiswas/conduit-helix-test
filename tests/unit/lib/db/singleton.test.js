// Unit test for the Sequelize singleton pattern (Story 1.1, AC-3).
// Verifies that importing the DB layer twice reuses the same instance and does not
// create a second connection pool.

import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

describe("DB layer singleton", () => {
  const saved = { ...process.env };

  beforeAll(() => {
    // Point the config at an in-memory SQLite DB so index.js can instantiate
    // Sequelize without a real PostgreSQL server.
    process.env.NODE_ENV = "development";
    process.env.DATABASE_URL = "sqlite::memory:";
    process.env.DB_DIALECT = "sqlite";
    // Clear the global so we start from a clean slate.
    delete globalThis.__conduitDb;
  });

  afterAll(() => {
    process.env = saved;
    delete globalThis.__conduitDb;
  });

  it("returns the same sequelize instance across repeated imports", async () => {
    vi.resetModules();
    const first = await import("../../../../src/lib/db/index.js");
    const firstInstance = first.sequelize;

    // A second dynamic import in the same process must reuse the stashed instance.
    vi.resetModules();
    const second = await import("../../../../src/lib/db/index.js");

    expect(second.default.sequelize).toBe(firstInstance);
    expect(globalThis.__conduitDb).toBeDefined();
  });

  it("exposes an authenticate() function and the four models", async () => {
    const mod = await import("../../../../src/lib/db/index.js");
    expect(typeof mod.authenticate).toBe("function");
    expect(mod.User).toBeDefined();
    expect(mod.Article).toBeDefined();
    expect(mod.Tag).toBeDefined();
    expect(mod.Comment).toBeDefined();
  });

  it("does not call sequelize.sync with alter/force anywhere in the module (ARCH-05)", async () => {
    // Static guard: read the module source and assert no unsafe sync call is present.
    const { readFileSync } = await import("node:fs");
    const { fileURLToPath } = await import("node:url");
    const path = fileURLToPath(
      new URL("../../../../src/lib/db/index.js", import.meta.url),
    );
    const source = readFileSync(path, "utf8");
    expect(source).not.toMatch(/sync\s*\(\s*\{[^}]*alter\s*:\s*true/);
    expect(source).not.toMatch(/sync\s*\(\s*\{[^}]*force\s*:\s*true/);
  });
});
