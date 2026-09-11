// API & Contract tests for the profile/user/follow Route Handlers (Story 1.3, Step 6.2).

import { describe, it, expect, beforeAll, beforeEach } from "vitest";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "sqlite::memory:";
process.env.DB_DIALECT = "sqlite";
process.env.JWT_SECRET = "profiles-api-secret";

const { sequelize, User } = await import("../../src/lib/db/index.js");
const { register } = await import("../../src/lib/services/users.js");
const { signSession, SESSION_COOKIE } = await import("../../src/lib/auth.js");
const userRoute = await import("../../src/app/api/user/route.js");
const profileRoute = await import(
  "../../src/app/api/profiles/[username]/route.js"
);
const followRoute = await import(
  "../../src/app/api/profiles/[username]/follow/route.js"
);

function req(url, { method = "GET", token, body } = {}) {
  const headers = { "content-type": "application/json" };
  if (token) headers.cookie = `${SESSION_COOKIE}=${token}`;
  return new Request(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function seed(username) {
  await register({
    username,
    email: `${username}@conduit.io`,
    password: "sup3rsecret",
  });
  const u = await User.findOne({ where: { username } });
  return { user: u, token: signSession(u) };
}

beforeAll(async () => {
  await sequelize.sync({ force: true });
});
beforeEach(async () => {
  await User.destroy({ where: {}, truncate: true });
});

describe("GET/PUT /api/user", () => {
  it("GET → 200 with the current user when authenticated", async () => {
    const { token } = await seed("amy");
    const res = await userRoute.GET(req("http://x/api/user", { token }));
    expect(res.status).toBe(200);
    expect((await res.json()).user.username).toBe("amy");
  });

  it("GET → 401 without a session", async () => {
    const res = await userRoute.GET(req("http://x/api/user"));
    expect(res.status).toBe(401);
    expect((await res.json())).toHaveProperty("errors.body");
  });

  it("PUT → 200 updates the profile", async () => {
    const { token } = await seed("ben");
    const res = await userRoute.PUT(
      req("http://x/api/user", {
        method: "PUT",
        token,
        body: { user: { bio: "updated" } },
      }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).user.bio).toBe("updated");
  });

  it("PUT → 401 without a session", async () => {
    const res = await userRoute.PUT(
      req("http://x/api/user", { method: "PUT", body: { user: {} } }),
    );
    expect(res.status).toBe(401);
  });
});

describe("GET /api/profiles/:username", () => {
  it("→ 200 for an existing profile (anonymous, following=false)", async () => {
    await seed("cara");
    const res = await profileRoute.GET(req("http://x/api/profiles/cara"), {
      params: Promise.resolve({ username: "cara" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.profile.username).toBe("cara");
    expect(body.profile.following).toBe(false);
  });

  it("→ 404 for an unknown profile", async () => {
    const res = await profileRoute.GET(req("http://x/api/profiles/ghost"), {
      params: Promise.resolve({ username: "ghost" }),
    });
    expect(res.status).toBe(404);
  });
});

describe("POST/DELETE /api/profiles/:username/follow", () => {
  it("POST → 200 follows; DELETE → 200 unfollows", async () => {
    const { token } = await seed("dan");
    await seed("eve");

    const followed = await followRoute.POST(
      req("http://x/api/profiles/eve/follow", { method: "POST", token }),
      { params: Promise.resolve({ username: "eve" }) },
    );
    expect(followed.status).toBe(200);
    expect((await followed.json()).profile.following).toBe(true);

    const unfollowed = await followRoute.DELETE(
      req("http://x/api/profiles/eve/follow", { method: "DELETE", token }),
      { params: Promise.resolve({ username: "eve" }) },
    );
    expect(unfollowed.status).toBe(200);
    expect((await unfollowed.json()).profile.following).toBe(false);
  });

  it("POST → 401 without a session", async () => {
    await seed("frank");
    const res = await followRoute.POST(
      req("http://x/api/profiles/frank/follow", { method: "POST" }),
      { params: Promise.resolve({ username: "frank" }) },
    );
    expect(res.status).toBe(401);
  });

  it("POST → 404 for an unknown target", async () => {
    const { token } = await seed("grace");
    const res = await followRoute.POST(
      req("http://x/api/profiles/ghost/follow", { method: "POST", token }),
      { params: Promise.resolve({ username: "ghost" }) },
    );
    expect(res.status).toBe(404);
  });
});
