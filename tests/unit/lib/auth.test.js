// Unit tests for the auth library (Story 1.2, REQ-F-15, REQ-NF-01).

import { describe, it, expect, beforeAll, beforeEach } from "vitest";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "sqlite::memory:";
process.env.DB_DIALECT = "sqlite";
process.env.JWT_SECRET = "test-secret";

const { sequelize, User } = await import("../../../src/lib/db/index.js");
const auth = await import("../../../src/lib/auth.js");
const { register } = await import("../../../src/lib/services/users.js");

beforeAll(async () => {
  await sequelize.sync({ force: true });
});
beforeEach(async () => {
  await User.destroy({ where: {}, truncate: true });
});

describe("signSession / verifySession", () => {
  it("round-trips a user's claims", () => {
    const token = auth.signSession({ username: "u", email: "u@x.io" });
    const claims = auth.verifySession(token);
    expect(claims.username).toBe("u");
    expect(claims.email).toBe("u@x.io");
  });

  it("returns null for a missing or invalid token", () => {
    expect(auth.verifySession(null)).toBeNull();
    expect(auth.verifySession("garbage")).toBeNull();
  });
});

describe("hashPassword / comparePassword", () => {
  it("hashes and verifies a password", async () => {
    const hash = await auth.hashPassword("sup3rsecret");
    expect(hash).not.toBe("sup3rsecret");
    expect(await auth.comparePassword("sup3rsecret", hash)).toBe(true);
    expect(await auth.comparePassword("wrong", hash)).toBe(false);
  });
});

describe("sessionCookie / clearSessionCookie", () => {
  it("marks the cookie httpOnly (not readable from JS — REQ-NF-01)", () => {
    const c = auth.sessionCookie("tok");
    expect(c.name).toBe(auth.SESSION_COOKIE);
    expect(c.httpOnly).toBe(true);
    expect(c.sameSite).toBe("lax");
  });
  it("clear cookie expires immediately", () => {
    expect(auth.clearSessionCookie().maxAge).toBe(0);
  });
});

describe("readCookie", () => {
  it("extracts a named cookie from the Cookie header", () => {
    const req = new Request("http://x/api", {
      headers: { cookie: "a=1; conduit_token=abc; b=2" },
    });
    expect(auth.readCookie(req, "conduit_token")).toBe("abc");
    expect(auth.readCookie(req, "missing")).toBeUndefined();
  });
  it("returns undefined when there is no Cookie header", () => {
    const req = new Request("http://x/api");
    expect(auth.readCookie(req, "conduit_token")).toBeUndefined();
  });
});

describe("getSessionUser / requireSessionUser", () => {
  it("resolves the user for a valid session cookie", async () => {
    const { token } = await register({
      username: "frank",
      email: "frank@conduit.io",
      password: "sup3rsecret",
    });
    const req = new Request("http://x/api", {
      headers: { cookie: `${auth.SESSION_COOKIE}=${token}` },
    });
    const user = await auth.getSessionUser(req);
    expect(user.email).toBe("frank@conduit.io");
  });

  it("returns null for a request with no session (soft auth)", async () => {
    const req = new Request("http://x/api");
    expect(await auth.getSessionUser(req)).toBeNull();
  });

  it("requireSessionUser throws UnauthorizedError when no session", async () => {
    const req = new Request("http://x/api");
    await expect(auth.requireSessionUser(req)).rejects.toThrow(
      /login first/,
    );
  });
});
