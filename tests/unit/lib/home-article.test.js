// Unit tests for the feed-params resolver + home-page/article-page assemblers (Story 1.7).

import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { resolveFeed, PAGE_SIZE } from "../../../src/lib/feed-params.js";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "sqlite::memory:";
process.env.DB_DIALECT = "sqlite";
process.env.JWT_SECRET = "home-article-secret";

const { sequelize, User, Comment, Article } = await import(
  "../../../src/lib/db/index.js"
);
const { register } = await import("../../../src/lib/services/users.js");
const articles = await import("../../../src/lib/services/articles.js");
const { getHomePage } = await import("../../../src/lib/services/home-page.js");
const { getArticlePage } = await import(
  "../../../src/lib/services/article-page.js"
);

async function author(username) {
  await register({
    username,
    email: `${username}@conduit.io`,
    password: "sup3rsecret",
  });
  return User.findOne({ where: { username } });
}

describe("resolveFeed", () => {
  it("defaults to global with no params", () => {
    const r = resolveFeed({}, false);
    expect(r.mode).toBe("global");
    expect(r.listQuery.limit).toBe(PAGE_SIZE);
    expect(r.listQuery.offset).toBe(0);
  });

  it("selects the tag feed when tag is present", () => {
    const r = resolveFeed({ tag: "react" }, false);
    expect(r.mode).toBe("tag");
    expect(r.tag).toBe("react");
    expect(r.listQuery.tag).toBe("react");
  });

  it("selects personal only when a viewer is present", () => {
    expect(resolveFeed({ feed: "personal" }, true).mode).toBe("personal");
    expect(resolveFeed({ feed: "personal" }, false).mode).toBe("global");
  });

  it("computes pagination offset from page", () => {
    expect(resolveFeed({ page: "3" }, false).listQuery.offset).toBe(
      2 * PAGE_SIZE,
    );
  });

  it("works with a URLSearchParams instance", () => {
    const r = resolveFeed(new URLSearchParams("tag=go&page=2"), false);
    expect(r.mode).toBe("tag");
    expect(r.tag).toBe("go");
    expect(r.listQuery.offset).toBe(PAGE_SIZE);
  });
});

describe("getHomePage", () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });
  beforeEach(async () => {
    await sequelize.sync({ force: true });
  });

  it("returns the global feed + popular tags", async () => {
    const amy = await author("amy");
    await articles.create(amy, {
      title: "one",
      description: "d",
      body: "b",
      tagList: ["react"],
    });
    await articles.create(amy, {
      title: "two",
      description: "d",
      body: "b",
      tagList: ["react"],
    });
    const { articles: rows, articlesCount, tags, mode } = await getHomePage(
      {},
      null,
    );
    expect(mode).toBe("global");
    expect(articlesCount).toBe(2);
    expect(rows).toHaveLength(2);
    expect(tags).toContain("react");
  });

  it("filters by tag", async () => {
    const ben = await author("ben");
    await articles.create(ben, {
      title: "tagged",
      description: "d",
      body: "b",
      tagList: ["elixir"],
    });
    await articles.create(ben, { title: "plain", description: "d", body: "b" });
    const { articles: rows } = await getHomePage({ tag: "elixir" }, null);
    expect(rows).toHaveLength(1);
    expect(rows[0].title).toBe("tagged");
  });

  it("returns the personal feed for a signed-in viewer", async () => {
    const author1 = await author("auth1");
    const follower = await author("follower");
    await author1.addFollower(follower);
    await articles.create(author1, {
      title: "followed-post",
      description: "d",
      body: "b",
    });
    const { mode, articlesCount } = await getHomePage(
      { feed: "personal" },
      follower,
    );
    expect(mode).toBe("personal");
    expect(articlesCount).toBe(1);
  });
});

describe("getArticlePage", () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });
  beforeEach(async () => {
    await sequelize.sync({ force: true });
  });

  it("returns the article and its comments", async () => {
    const cara = await author("cara");
    await articles.create(cara, {
      title: "readable",
      description: "d",
      body: "hello",
    });
    const dan = await author("dan");
    const art = await Article.findOne({ where: { slug: "readable" } });
    await Comment.create({ body: "nice", articleId: art.id, userId: dan.id });

    const { article, comments } = await getArticlePage("readable", null);
    expect(article.slug).toBe("readable");
    expect(comments).toHaveLength(1);
    expect(comments[0].body).toBe("nice");
  });

  it("propagates NotFoundError for an unknown slug", async () => {
    await expect(getArticlePage("ghost", null)).rejects.toThrow(/not found/);
  });
});
