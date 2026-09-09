// Unit tests for the server session helper + client-api request wrappers (Story 1.6).

import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "sqlite::memory:";
process.env.DB_DIALECT = "sqlite";
process.env.JWT_SECRET = "session-test-secret";

// Mock next/headers cookies() with a controllable store.
const cookieStore = {
  _map: new Map(),
  get(name) {
    return this._map.has(name) ? { value: this._map.get(name) } : undefined;
  },
  set(name, value) {
    this._map.set(name, value);
  },
};
vi.mock("next/headers", () => ({
  cookies: async () => cookieStore,
}));

const { sequelize, User } = await import("../../../src/lib/db/index.js");
const { register } = await import("../../../src/lib/services/users.js");
const { signSession, SESSION_COOKIE } = await import("../../../src/lib/auth.js");
const { getServerSession, logout } = await import(
  "../../../src/lib/session.js"
);
const clientApi = await import("../../../src/lib/client-api.js");

beforeAll(async () => {
  await sequelize.sync({ force: true });
});
beforeEach(async () => {
  await User.destroy({ where: {}, truncate: true });
  cookieStore._map.clear();
});

describe("getServerSession", () => {
  it("resolves the user from a valid session cookie (no localStorage)", async () => {
    await register({
      username: "amy",
      email: "amy@conduit.io",
      password: "sup3rsecret",
    });
    const u = await User.findOne({ where: { username: "amy" } });
    cookieStore.set(SESSION_COOKIE, signSession(u));

    const resolved = await getServerSession();
    expect(resolved.username).toBe("amy");
  });

  it("returns null when there is no session cookie", async () => {
    expect(await getServerSession()).toBeNull();
  });

  it("returns null for a tampered/invalid cookie", async () => {
    cookieStore.set(SESSION_COOKIE, "not-a-jwt");
    expect(await getServerSession()).toBeNull();
  });
});

describe("logout", () => {
  it("clears the session cookie (maxAge 0)", async () => {
    cookieStore.set(SESSION_COOKIE, "something");
    await logout();
    // clearSessionCookie sets the value to "" — our mock store records the last set value.
    expect(cookieStore.get(SESSION_COOKIE).value).toBe("");
  });
});

describe("client-api request wrappers", () => {
  it("apiPost sends JSON with credentials and returns {ok,status,data}", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ user: { username: "amy" } }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    const res = await clientApi.apiPost("/api/users/login", {
      user: { email: "a@b.io", password: "pw" },
    });
    expect(res.ok).toBe(true);
    expect(res.data.user.username).toBe("amy");
    const [, opts] = fetchMock.mock.calls[0];
    expect(opts.method).toBe("POST");
    expect(opts.credentials).toBe("include");

    vi.unstubAllGlobals();
  });

  it("apiPut surfaces a non-ok response with its data", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 422,
        json: async () => ({ errors: { body: ["bad"] } }),
      })),
    );
    const res = await clientApi.apiPut("/api/user", { user: {} });
    expect(res.ok).toBe(false);
    expect(res.status).toBe(422);
    expect(clientApi.normaliseErrors(res.data)).toEqual(["bad"]);
    vi.unstubAllGlobals();
  });
});
