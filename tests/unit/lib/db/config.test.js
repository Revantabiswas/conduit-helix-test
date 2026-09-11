// Unit tests for the env-driven DB config (Story 1.1, AC-4).

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { resolveDbConfig, parseLogging } from "../../../../src/lib/db/config.js";

const DB_KEYS = [
  "DATABASE_URL",
  "DB_USERNAME",
  "DB_PASSWORD",
  "DB_NAME",
  "DB_HOSTNAME",
  "DB_DIALECT",
  "DB_LOGGING",
  "DEV_DB_USERNAME",
  "DEV_DB_PASSWORD",
  "DEV_DB_NAME",
  "DEV_DB_HOSTNAME",
  "DEV_DB_DIALECT",
];

describe("resolveDbConfig", () => {
  const saved = {};
  beforeEach(() => {
    for (const k of DB_KEYS) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
  });
  afterEach(() => {
    for (const k of DB_KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  it("prefers DATABASE_URL when present", () => {
    process.env.DATABASE_URL = "postgres://u:p@h:5432/db";
    const cfg = resolveDbConfig();
    expect(cfg.url).toBe("postgres://u:p@h:5432/db");
    expect(cfg.dialect).toBe("postgres");
  });

  it("falls back to discrete DB_* variables", () => {
    process.env.DB_USERNAME = "conduit_user";
    process.env.DB_PASSWORD = "secret";
    process.env.DB_NAME = "conduit";
    const cfg = resolveDbConfig();
    expect(cfg.url).toBeUndefined();
    expect(cfg.username).toBe("conduit_user");
    expect(cfg.password).toBe("secret");
    expect(cfg.database).toBe("conduit");
    expect(cfg.host).toBe("localhost");
    expect(cfg.dialect).toBe("postgres");
  });

  it("stays backward-compatible with legacy DEV_DB_* names", () => {
    const savedEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    process.env.DEV_DB_USERNAME = "legacy_user";
    process.env.DEV_DB_NAME = "legacy_db";
    const cfg = resolveDbConfig();
    expect(cfg.username).toBe("legacy_user");
    expect(cfg.database).toBe("legacy_db");
    process.env.NODE_ENV = savedEnv;
  });

  it("does not hardcode any credentials (all values come from env)", () => {
    const cfg = resolveDbConfig();
    expect(cfg.username).toBeUndefined();
    expect(cfg.password).toBeUndefined();
    expect(cfg.database).toBeUndefined();
  });
});

describe("parseLogging", () => {
  it("returns console.log for 'true' / '1'", () => {
    expect(parseLogging("true")).toBe(console.log);
    expect(parseLogging("1")).toBe(console.log);
  });
  it("returns false otherwise", () => {
    expect(parseLogging("false")).toBe(false);
    expect(parseLogging(undefined)).toBe(false);
    expect(parseLogging("anything")).toBe(false);
  });
});
