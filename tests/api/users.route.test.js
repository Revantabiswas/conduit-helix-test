// API & Contract tests for the auth Route Handlers (Story 1.2, Step 6.2 gate).
// Invokes the real POST handlers with Request objects and asserts:
//  - functional / happy path
//  - response-code validation (201/200/422/404)
//  - error-response contract ({ errors: { body: [...] } })
//  - request validation (missing/invalid fields)
//  - response contract/schema ({ user: { email, username, token } }, no password)
//  - httpOnly session cookie is set (REQ-NF-01)
// (Role-based 401/403 is exercised by src/lib/auth.requireSessionUser unit tests; these
//  register/login endpoints are intentionally public — no auth required to reach them.)

import { describe, it, expect, beforeAll, beforeEach } from "vitest";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "sqlite::memory:";
process.env.DB_DIALECT = "sqlite";
process.env.JWT_SECRET = "api-test-secret";

const { sequelize, User } = await import("../../src/lib/db/index.js");
const { POST: registerPOST } = await import(
  "../../src/app/api/users/route.js"
);
const { POST: loginPOST } = await import(
  "../../src/app/api/users/login/route.js"
);

function jsonRequest(url, body) {
  return new Request(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeAll(async () => {
  await sequelize.sync({ force: true });
});
beforeEach(async () => {
  await User.destroy({ where: {}, truncate: true });
});

describe("POST /api/users (register)", () => {
  it("happy path → 201, { user } contract, httpOnly cookie, no password", async () => {
    const res = await registerPOST(
      jsonRequest("http://x/api/users", {
        user: {
          username: "alice",
          email: "alice@conduit.io",
          password: "sup3rsecret",
        },
      }),
    );
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.user.email).toBe("alice@conduit.io");
    expect(body.user.username).toBe("alice");
    expect(body.user.token).toBeTruthy();
    expect(body.user.password).toBeUndefined();

    // httpOnly session cookie (REQ-NF-01)
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toMatch(/conduit_token=/);
    expect(setCookie.toLowerCase()).toContain("httponly");
  });

  it("request validation → 422 with Conduit error envelope on bad email", async () => {
    const res = await registerPOST(
      jsonRequest("http://x/api/users", {
        user: { username: "bob", email: "nope", password: "sup3rsecret" },
      }),
    );
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body).toHaveProperty("errors.body");
    expect(Array.isArray(body.errors.body)).toBe(true);
  });

  it("request validation → 422 on missing fields", async () => {
    const res = await registerPOST(
      jsonRequest("http://x/api/users", { user: {} }),
    );
    expect(res.status).toBe(422);
  });

  it("duplicate email → 422", async () => {
    await registerPOST(
      jsonRequest("http://x/api/users", {
        user: {
          username: "carol",
          email: "dup@conduit.io",
          password: "sup3rsecret",
        },
      }),
    );
    const res = await registerPOST(
      jsonRequest("http://x/api/users", {
        user: {
          username: "carol2",
          email: "dup@conduit.io",
          password: "sup3rsecret",
        },
      }),
    );
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.errors.body[0]).toMatch(/Email already exists/);
  });
});

describe("POST /api/users/login", () => {
  async function seed() {
    await registerPOST(
      jsonRequest("http://x/api/users", {
        user: {
          username: "dave",
          email: "dave@conduit.io",
          password: "sup3rsecret",
        },
      }),
    );
  }

  it("happy path → 200, { user } + token + httpOnly cookie", async () => {
    await seed();
    const res = await loginPOST(
      jsonRequest("http://x/api/users/login", {
        user: { email: "dave@conduit.io", password: "sup3rsecret" },
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.user.email).toBe("dave@conduit.io");
    expect(body.user.token).toBeTruthy();
    expect(res.headers.get("set-cookie").toLowerCase()).toContain("httponly");
  });

  it("wrong password → 422 with error envelope", async () => {
    await seed();
    const res = await loginPOST(
      jsonRequest("http://x/api/users/login", {
        user: { email: "dave@conduit.io", password: "wrongpass" },
      }),
    );
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.errors.body[0]).toMatch(/Wrong email\/password/);
  });

  it("unknown email → 404", async () => {
    const res = await loginPOST(
      jsonRequest("http://x/api/users/login", {
        user: { email: "ghost@conduit.io", password: "whatever1" },
      }),
    );
    expect(res.status).toBe(404);
  });
});
