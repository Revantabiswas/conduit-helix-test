// Unit tests for the ported Sequelize models (Story 1.1, AC-2).
// Uses an in-memory SQLite database so the tests run without a real PostgreSQL instance.

import { describe, it, expect, beforeAll } from "vitest";
import { Sequelize, DataTypes } from "sequelize";
import defineUser from "../../../../src/lib/db/models/User.js";
import defineArticle from "../../../../src/lib/db/models/Article.js";
import defineTag from "../../../../src/lib/db/models/Tag.js";
import defineComment from "../../../../src/lib/db/models/Comment.js";

function buildDb() {
  const sequelize = new Sequelize("sqlite::memory:", { logging: false });
  const db = { sequelize, Sequelize };
  const factories = {
    User: defineUser,
    Article: defineArticle,
    Tag: defineTag,
    Comment: defineComment,
  };
  for (const [name, factory] of Object.entries(factories)) {
    db[name] = factory(sequelize, DataTypes);
  }
  for (const name of Object.keys(factories)) {
    db[name].associate(db);
  }
  return db;
}

describe("Ported Sequelize models", () => {
  let db;
  beforeAll(() => {
    db = buildDb();
  });

  it("defines all four models", () => {
    expect(db.User).toBeDefined();
    expect(db.Article).toBeDefined();
    expect(db.Tag).toBeDefined();
    expect(db.Comment).toBeDefined();
  });

  it("User has favorites, followers and following associations", () => {
    expect(db.User.associations.favorites).toBeDefined();
    expect(db.User.associations.followers).toBeDefined();
    expect(db.User.associations.following).toBeDefined();
  });

  it("Article has author, tagList and comments associations", () => {
    expect(db.Article.associations.author).toBeDefined();
    expect(db.Article.associations.tagList).toBeDefined();
    // hasMany Comment is registered under the model name pluralised by Sequelize.
    const hasCommentAssoc = Object.values(db.Article.associations).some(
      (a) => a.target === db.Comment,
    );
    expect(hasCommentAssoc).toBe(true);
  });

  it("Comment belongs to an author (User) and an Article", () => {
    expect(db.Comment.associations.author).toBeDefined();
    const belongsToArticle = Object.values(db.Comment.associations).some(
      (a) => a.target === db.Article,
    );
    expect(belongsToArticle).toBe(true);
  });

  it("User.toJSON redacts id, password and timestamps", async () => {
    await db.sequelize.sync();
    const user = await db.User.create({
      email: "a@b.c",
      username: "alice",
      password: "hashed-secret",
    });
    const json = user.toJSON();
    expect(json.password).toBeUndefined();
    expect(json.id).toBeUndefined();
    expect(json.createdAt).toBeUndefined();
    expect(json.updatedAt).toBeUndefined();
    expect(json.email).toBe("a@b.c");
    expect(json.username).toBe("alice");
  });

  it("Article.toJSON redacts id and userId", async () => {
    await db.sequelize.sync();
    const article = await db.Article.create({
      slug: "hello-world",
      title: "Hello World",
      description: "d",
      body: "b",
    });
    const json = article.toJSON();
    expect(json.id).toBeUndefined();
    expect(json.userId).toBeUndefined();
    expect(json.slug).toBe("hello-world");
  });

  it("can eager-load an Article with its Tag and author in one query (AC-5 smoke)", async () => {
    await db.sequelize.sync({ force: true });
    const author = await db.User.create({
      email: "auth@x.c",
      username: "author1",
      password: "h",
    });
    const article = await db.Article.create({
      slug: "s1",
      title: "t",
      description: "d",
      body: "b",
      userId: author.id,
    });
    const tag = await db.Tag.create({ name: "react" });
    await article.addTagList(tag);

    const loaded = await db.Article.findOne({
      where: { slug: "s1" },
      include: [
        { model: db.Tag, as: "tagList" },
        { model: db.User, as: "author" },
      ],
    });
    expect(loaded).not.toBeNull();
    expect(loaded.author.username).toBe("author1");
    expect(loaded.tagList.map((t) => t.name)).toContain("react");
  });
});
