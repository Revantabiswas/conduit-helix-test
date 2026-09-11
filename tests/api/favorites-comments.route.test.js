// API & Contract tests for favorite + comments Route Handlers (Story 1.5, Step 6.2).

import { describe, it, expect, beforeAll, beforeEach } from "vitest";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "sqlite::memory:";
process.env.DB_DIALECT = "sqlite";
process.env.JWT_SECRET = "fav-comment-api-secret";

const { sequelize, User } = await import("../../src/lib/db/index.js");
const { register } = await import("../../src/lib/services/users.js");
const { signSession, SESSION_COOKIE } = await import("../../src/lib/auth.js");
const arts = await import("../../src/lib/services/articles.js");
const favRoute = await import(
  "../../src/app/api/articles/[slug]/favorite/route.js"
);
const commentsRoute = await import(
  "../../src/app/api/articles/[slug]/comments/route.js"
);
const commentIdRoute = await import(
  "../../src/app/api/articles/[slug]/comments/[id]/route.js"
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
async function user(username) {
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
  await sequelize.sync({ force: true });
});

describe("favorite POST/DELETE", () => {
  it("POST → 200 favorited; DELETE → 200 unfavorited", async () => {
    const amy = await user("amy");
    await arts.create(amy.user, { title: "hello", description: "d", body: "b" });
    const ben = await user("ben");

    const fav = await favRoute.POST(
      req("http://x/api/articles/hello/favorite", { method: "POST", token: ben.token }),
      { params: Promise.resolve({ slug: "hello" }) },
    );
    expect(fav.status).toBe(200);
    expect((await fav.json()).article.favorited).toBe(true);

    const unfav = await favRoute.DELETE(
      req("http://x/api/articles/hello/favorite", { method: "DELETE", token: ben.token }),
      { params: Promise.resolve({ slug: "hello" }) },
    );
    expect(unfav.status).toBe(200);
    expect((await unfav.json()).article.favorited).toBe(false);
  });

  it("POST → 401 without a session", async () => {
    const res = await favRoute.POST(
      req("http://x/api/articles/hello/favorite", { method: "POST" }),
      { params: Promise.resolve({ slug: "hello" }) },
    );
    expect(res.status).toBe(401);
  });

  it("POST → 404 for a missing article", async () => {
    const { token } = await user("cara");
    const res = await favRoute.POST(
      req("http://x/api/articles/ghost/favorite", { method: "POST", token }),
      { params: Promise.resolve({ slug: "ghost" }) },
    );
    expect(res.status).toBe(404);
  });
});

describe("comments GET/POST/DELETE", () => {
  async function seedArticle() {
    const dan = await user("dan");
    await arts.create(dan.user, { title: "post", description: "d", body: "b" });
    return dan;
  }

  it("POST → 201, GET → 200 list, contract shape", async () => {
    await seedArticle();
    const reader = await user("reader");
    const created = await commentsRoute.POST(
      req("http://x/api/articles/post/comments", {
        method: "POST",
        token: reader.token,
        body: { comment: { body: "great" } },
      }),
      { params: Promise.resolve({ slug: "post" }) },
    );
    expect(created.status).toBe(201);
    const cbody = await created.json();
    expect(cbody.comment.body).toBe("great");
    expect(cbody.comment.author.username).toBe("reader");

    const listed = await commentsRoute.GET(
      req("http://x/api/articles/post/comments"),
      { params: Promise.resolve({ slug: "post" }) },
    );
    expect(listed.status).toBe(200);
    expect((await listed.json()).comments).toHaveLength(1);
  });

  it("POST → 401 unauth, 422 empty body, 404 missing article", async () => {
    await seedArticle();
    const reader = await user("reader2");

    const unauth = await commentsRoute.POST(
      req("http://x/api/articles/post/comments", {
        method: "POST",
        body: { comment: { body: "x" } },
      }),
      { params: Promise.resolve({ slug: "post" }) },
    );
    expect(unauth.status).toBe(401);

    const empty = await commentsRoute.POST(
      req("http://x/api/articles/post/comments", {
        method: "POST",
        token: reader.token,
        body: { comment: { body: "" } },
      }),
      { params: Promise.resolve({ slug: "post" }) },
    );
    expect(empty.status).toBe(422);

    const missing = await commentsRoute.POST(
      req("http://x/api/articles/ghost/comments", {
        method: "POST",
        token: reader.token,
        body: { comment: { body: "hi" } },
      }),
      { params: Promise.resolve({ slug: "ghost" }) },
    );
    expect(missing.status).toBe(404);
  });

  it("DELETE → 200 (author), 403 (non-author)", async () => {
    await seedArticle();
    const owner = await user("owner");
    const other = await user("other");
    const created = await commentsRoute.POST(
      req("http://x/api/articles/post/comments", {
        method: "POST",
        token: owner.token,
        body: { comment: { body: "mine" } },
      }),
      { params: Promise.resolve({ slug: "post" }) },
    );
    const id = (await created.json()).comment.id;

    const forbidden = await commentIdRoute.DELETE(
      req(`http://x/api/articles/post/comments/${id}`, {
        method: "DELETE",
        token: other.token,
      }),
      { params: Promise.resolve({ slug: "post", id: String(id) }) },
    );
    expect(forbidden.status).toBe(403);

    const okd = await commentIdRoute.DELETE(
      req(`http://x/api/articles/post/comments/${id}`, {
        method: "DELETE",
        token: owner.token,
      }),
      { params: Promise.resolve({ slug: "post", id: String(id) }) },
    );
    expect(okd.status).toBe(200);
  });
});
