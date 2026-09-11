// Unit tests for the articles + tags services (Story 1.4, REQ-F-12/14/17).
// Includes the N+1 assertion: a multi-article page issues a bounded query count.

import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "sqlite::memory:";
process.env.DB_DIALECT = "sqlite";
process.env.JWT_SECRET = "articles-test-secret";

const { sequelize, User } = await import("../../../../src/lib/db/index.js");
const { register } = await import("../../../../src/lib/services/users.js");
const articles = await import("../../../../src/lib/services/articles.js");
const tags = await import("../../../../src/lib/services/tags.js");

async function author(username) {
  await register({
    username,
    email: `${username}@conduit.io`,
    password: "sup3rsecret",
  });
  return User.findOne({ where: { username } });
}

beforeAll(async () => {
  await sequelize.sync({ force: true });
});
beforeEach(async () => {
  await sequelize.sync({ force: true });
});

describe("create", () => {
  it("creates an article with slug, author, and tags", async () => {
    const amy = await author("amy");
    const { article } = await articles.create(amy, {
      title: "Hello World",
      description: "d",
      body: "b",
      tagList: ["react", "next"],
    });
    expect(article.slug).toBe("hello-world");
    expect(article.author.username).toBe("amy");
    expect(article.tagList).toEqual(["next", "react"]);
    expect(article.favorited).toBe(false);
    expect(article.favoritesCount).toBe(0);
  });

  it("rejects a missing title", async () => {
    const jack = await author("jack");
    await expect(
      articles.create(jack, { description: "d", body: "b" }),
    ).rejects.toThrow(/title/);
  });

  it("rejects a duplicate slug", async () => {
    const u = await author("dup");
    await articles.create(u, { title: "Same", description: "d", body: "b" });
    await expect(
      articles.create(u, { title: "Same", description: "d2", body: "b2" }),
    ).rejects.toThrow(/already exists/);
  });
});

describe("list", () => {
  it("returns articles newest first with a count", async () => {
    const ben = await author("ben");
    await articles.create(ben, { title: "First Post", description: "d", body: "b" });
    await articles.create(ben, { title: "Second Post", description: "d", body: "b" });
    const { articles: rows, articlesCount } = await articles.list({}, null);
    expect(articlesCount).toBe(2);
    expect(rows[0].title).toBe("Second Post");
  });

  it("filters by tag", async () => {
    const cara = await author("cara");
    await articles.create(cara, {
      title: "Tagged",
      description: "d",
      body: "b",
      tagList: ["elixir"],
    });
    await articles.create(cara, { title: "Untagged", description: "d", body: "b" });
    const { articles: rows, articlesCount } = await articles.list(
      { tag: "elixir" },
      null,
    );
    expect(articlesCount).toBe(1);
    expect(rows[0].title).toBe("Tagged");
  });

  it("issues a BOUNDED number of queries for a multi-article page (N+1 fix)", async () => {
    const dan = await author("dan");
    for (let i = 0; i < 5; i++) {
      await articles.create(dan, {
        title: `Post ${i}`,
        description: "d",
        body: "b",
        tagList: ["t"],
      });
    }
    const spy = vi.spyOn(sequelize, "query");
    await articles.list({}, dan);
    const queryCount = spy.mock.calls.length;
    spy.mockRestore();
    // 5 articles: without the fix this would be ~1 + 5*N. The bounded design keeps it small.
    expect(queryCount).toBeLessThanOrEqual(6);
  });
});

describe("get / update / delete", () => {
  it("gets a single article by slug", async () => {
    const eve = await author("eve");
    await articles.create(eve, { title: "Readable", description: "d", body: "b" });
    const { article } = await articles.get("readable", eve);
    expect(article.slug).toBe("readable");
    expect(article.author.username).toBe("eve");
  });

  it("throws NotFoundError for an unknown slug", async () => {
    await expect(articles.get("nope", null)).rejects.toThrow(/not found/);
  });

  it("author can update their own article", async () => {
    const finn = await author("finn");
    await articles.create(finn, { title: "Original", description: "d", body: "b" });
    const { article } = await articles.update("original", finn, {
      body: "new body",
    });
    expect(article.body).toBe("new body");
  });

  it("non-author cannot update", async () => {
    const gwen = await author("gwen");
    const hank = await author("hank");
    await articles.create(gwen, { title: "Guarded", description: "d", body: "b" });
    await expect(
      articles.update("guarded", hank, { body: "x" }),
    ).rejects.toThrow(/not the author/);
  });

  it("update changes description and title (re-slugs)", async () => {
    const opal = await author("opal");
    await articles.create(opal, { title: "Old Title", description: "old", body: "b" });
    const { article } = await articles.update("old-title", opal, {
      title: "Brand New Title",
      description: "fresh",
    });
    expect(article.slug).toBe("brand-new-title");
    expect(article.description).toBe("fresh");
  });

  it("skips blank tags on create", async () => {
    const pat = await author("pat");
    const { article } = await articles.create(pat, {
      title: "Blank Tags",
      description: "d",
      body: "b",
      tagList: ["valid", "  ", ""],
    });
    expect(article.tagList).toEqual(["valid"]);
  });

  it("author can delete their own article", async () => {
    const ida = await author("ida");
    await articles.create(ida, { title: "Temporary", description: "d", body: "b" });
    const res = await articles.del("temporary", ida);
    expect(res.message.body[0]).toMatch(/deleted/);
    await expect(articles.get("temporary", null)).rejects.toThrow(/not found/);
  });
});

describe("feed", () => {
  it("returns only followed authors' articles", async () => {
    const kate = await author("kate");
    const leo = await author("leo");
    // Set up the follow relationship directly via the model association (Story 1.4 does
    // not depend on the profiles service from Story 1.3).
    await leo.addFollower(kate);
    await articles.create(leo, { title: "From Leo", description: "d", body: "b" });
    await articles.create(kate, { title: "From Kate", description: "d", body: "b" });
    const { articles: rows, articlesCount } = await articles.feed(kate, {});
    expect(articlesCount).toBe(1);
    expect(rows[0].title).toBe("From Leo");
  });
});

describe("tags service", () => {
  it("lists all tag names", async () => {
    const mia = await author("mia");
    await articles.create(mia, {
      title: "Tagged Post",
      description: "d",
      body: "b",
      tagList: ["go", "rust"],
    });
    const { tags: names } = await tags.list();
    expect(names).toContain("go");
    expect(names).toContain("rust");
  });
});
