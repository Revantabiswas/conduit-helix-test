// Unit tests for the favorites + comments services (Story 1.5, REQ-F-12).

import { describe, it, expect, beforeAll, beforeEach } from "vitest";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "sqlite::memory:";
process.env.DB_DIALECT = "sqlite";
process.env.JWT_SECRET = "fav-comment-secret";

const { sequelize, User } = await import("../../../../src/lib/db/index.js");
const { register } = await import("../../../../src/lib/services/users.js");
const articles = await import("../../../../src/lib/services/articles.js");
const favorites = await import("../../../../src/lib/services/favorites.js");
const comments = await import("../../../../src/lib/services/comments.js");

async function user(username) {
  await register({
    username,
    email: `${username}@conduit.io`,
    password: "sup3rsecret",
  });
  return User.findOne({ where: { username } });
}

async function articleBy(author, title) {
  await articles.create(author, { title, description: "d", body: "b" });
}

beforeAll(async () => {
  await sequelize.sync({ force: true });
});
beforeEach(async () => {
  await sequelize.sync({ force: true });
});

describe("favorites service", () => {
  it("favorite marks favorited and counts", async () => {
    const amy = await user("amy");
    await articleBy(amy, "hello");
    const ben = await user("ben");
    const { article } = await favorites.toggle("hello", ben, true);
    expect(article.favorited).toBe(true);
    expect(article.favoritesCount).toBe(1);
  });

  it("unfavorite reverses it", async () => {
    const cara = await user("cara");
    await articleBy(cara, "post");
    const dan = await user("dan");
    await favorites.toggle("post", dan, true);
    const { article } = await favorites.toggle("post", dan, false);
    expect(article.favorited).toBe(false);
    expect(article.favoritesCount).toBe(0);
  });

  it("favorite is idempotent", async () => {
    const eve = await user("eve");
    await articleBy(eve, "idem");
    const finn = await user("finn");
    await favorites.toggle("idem", finn, true);
    const { article } = await favorites.toggle("idem", finn, true);
    expect(article.favoritesCount).toBe(1);
  });

  it("favoriting an unknown article is not found", async () => {
    const rae = await user("rae");
    await expect(favorites.toggle("ghost", rae, true)).rejects.toThrow(
      /not found/,
    );
  });
});

describe("comments service", () => {
  it("creates a comment with author", async () => {
    const gwen = await user("gwen");
    await articleBy(gwen, "discuss");
    const hank = await user("hank");
    const { comment } = await comments.create("discuss", hank, "nice post");
    expect(comment.body).toBe("nice post");
    expect(comment.author.username).toBe("hank");
    expect(comment.id).toBeTruthy();
  });

  it("lists comments with authors", async () => {
    const ida = await user("ida");
    await articleBy(ida, "threaded");
    const jack = await user("jack");
    await comments.create("threaded", jack, "first");
    const { comments: list } = await comments.list("threaded");
    expect(list).toHaveLength(1);
    expect(list[0].author.username).toBe("jack");
  });

  it("rejects an empty comment body", async () => {
    const pat = await user("pat");
    await articleBy(pat, "empty");
    const quinn = await user("quinn");
    await expect(comments.create("empty", quinn, "")).rejects.toThrow(
      /required/,
    );
  });

  it("author can delete their own comment", async () => {
    const kate = await user("kate");
    await articleBy(kate, "removable");
    const leo = await user("leo");
    const { comment } = await comments.create("removable", leo, "temp");
    const res = await comments.del("removable", comment.id, leo);
    expect(res.message.body[0]).toMatch(/deleted/);
    const { comments: list } = await comments.list("removable");
    expect(list).toHaveLength(0);
  });

  it("non-author cannot delete a comment", async () => {
    const mia = await user("mia");
    await articleBy(mia, "guarded");
    const ned = await user("ned");
    const olga = await user("olga");
    const { comment } = await comments.create("guarded", ned, "mine");
    await expect(
      comments.del("guarded", comment.id, olga),
    ).rejects.toThrow(/not the author/);
  });

  it("deleting a missing comment is not found", async () => {
    const zoe = await user("zoe");
    await expect(comments.del("x", 9999, zoe)).rejects.toThrow(/not found/);
  });
});
