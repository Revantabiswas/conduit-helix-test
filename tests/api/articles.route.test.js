// API & Contract tests for the articles + tags Route Handlers (Story 1.4, Step 6.2).

import { describe, it, expect, beforeAll, beforeEach } from "vitest";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "sqlite::memory:";
process.env.DB_DIALECT = "sqlite";
process.env.JWT_SECRET = "articles-api-secret";

const { sequelize, User } = await import("../../src/lib/db/index.js");
const { register } = await import("../../src/lib/services/users.js");
const { signSession, SESSION_COOKIE } = await import("../../src/lib/auth.js");
const listCreate = await import("../../src/app/api/articles/route.js");
const bySlug = await import("../../src/app/api/articles/[slug]/route.js");
const feedRoute = await import("../../src/app/api/articles/feed/route.js");
const tagsRoute = await import("../../src/app/api/tags/route.js");

function req(url, { method = "GET", token, body } = {}) {
  const headers = { "content-type": "application/json" };
  if (token) headers.cookie = `${SESSION_COOKIE}=${token}`;
  return new Request(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function author(username) {
  await register({
    username,
    email: `${username}@conduit.io`,
    password: "sup3rsecret",
  });
  const u = await User.findOne({ where: { username } });
  return { user: u, token: signSession(u) };
}

async function createArticle(token, title, tagList = []) {
  return listCreate.POST(
    req("http://x/api/articles", {
      method: "POST",
      token,
      body: { article: { title, description: "d", body: "b", tagList } },
    }),
  );
}

beforeAll(async () => {
  await sequelize.sync({ force: true });
});
beforeEach(async () => {
  await sequelize.sync({ force: true });
});

describe("POST /api/articles", () => {
  it("→ 201 with the created article contract", async () => {
    const { token } = await author("amy");
    const res = await createArticle(token, "Hello World", ["react"]);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.article.slug).toBe("hello-world");
    expect(body.article.author.username).toBe("amy");
    expect(body.article.tagList).toContain("react");
  });

  it("→ 401 without a session", async () => {
    const res = await createArticle(undefined, "No Auth");
    expect(res.status).toBe(401);
  });

  it("→ 422 without a title", async () => {
    const { token } = await author("bob");
    const res = await listCreate.POST(
      req("http://x/api/articles", {
        method: "POST",
        token,
        body: { article: { description: "d", body: "b" } },
      }),
    );
    expect(res.status).toBe(422);
    expect(await res.json()).toHaveProperty("errors.body");
  });
});

describe("GET /api/articles", () => {
  it("→ 200 with a list + count", async () => {
    const { token } = await author("cara");
    await createArticle(token, "P1");
    await createArticle(token, "P2");
    const res = await listCreate.GET(req("http://x/api/articles"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.articlesCount).toBe(2);
    expect(body.articles).toHaveLength(2);
  });
});

describe("GET/PUT/DELETE /api/articles/:slug", () => {
  it("GET → 200 / 404", async () => {
    const { token } = await author("dan");
    await createArticle(token, "Readable");
    const ok = await bySlug.GET(req("http://x/api/articles/readable"), {
      params: Promise.resolve({ slug: "readable" }),
    });
    expect(ok.status).toBe(200);
    const missing = await bySlug.GET(req("http://x/api/articles/nope"), {
      params: Promise.resolve({ slug: "nope" }),
    });
    expect(missing.status).toBe(404);
  });

  it("PUT → 200 (author), 401 (anon), 403 (non-author)", async () => {
    const { token } = await author("eve");
    const other = await author("mallory");
    await createArticle(token, "Owned");

    const okd = await bySlug.PUT(
      req("http://x/api/articles/owned", {
        method: "PUT",
        token,
        body: { article: { body: "updated" } },
      }),
      { params: Promise.resolve({ slug: "owned" }) },
    );
    expect(okd.status).toBe(200);
    expect((await okd.json()).article.body).toBe("updated");

    const anon = await bySlug.PUT(
      req("http://x/api/articles/owned", {
        method: "PUT",
        body: { article: { body: "x" } },
      }),
      { params: Promise.resolve({ slug: "owned" }) },
    );
    expect(anon.status).toBe(401);

    const forbidden = await bySlug.PUT(
      req("http://x/api/articles/owned", {
        method: "PUT",
        token: other.token,
        body: { article: { body: "x" } },
      }),
      { params: Promise.resolve({ slug: "owned" }) },
    );
    expect(forbidden.status).toBe(403);
  });

  it("DELETE → 200 (author), 403 (non-author)", async () => {
    const { token } = await author("finn");
    const other = await author("trudy");
    await createArticle(token, "Deletable");

    const forbidden = await bySlug.DELETE(
      req("http://x/api/articles/deletable", {
        method: "DELETE",
        token: other.token,
      }),
      { params: Promise.resolve({ slug: "deletable" }) },
    );
    expect(forbidden.status).toBe(403);

    const okd = await bySlug.DELETE(
      req("http://x/api/articles/deletable", {
        method: "DELETE",
        token,
      }),
      { params: Promise.resolve({ slug: "deletable" }) },
    );
    expect(okd.status).toBe(200);
  });
});

describe("GET /api/articles/feed", () => {
  it("→ 401 without a session", async () => {
    const res = await feedRoute.GET(req("http://x/api/articles/feed"));
    expect(res.status).toBe(401);
  });
  it("→ 200 with the followed authors' articles", async () => {
    const kate = await author("kate");
    const leo = await author("leo");
    await leo.user.addFollower(kate.user);
    await createArticle(leo.token, "From Leo");
    const res = await feedRoute.GET(
      req("http://x/api/articles/feed", { token: kate.token }),
    );
    expect(res.status).toBe(200);
    expect((await res.json()).articlesCount).toBe(1);
  });
});

describe("GET /api/tags", () => {
  it("→ 200 with the tag names", async () => {
    const { token } = await author("mia");
    await createArticle(token, "Tagged", ["go", "rust"]);
    const res = await tagsRoute.GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.tags).toContain("go");
    expect(body.tags).toContain("rust");
  });
});
