// Unit tests for the editor payload builder + profile-page assembler (Story 1.8).

import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { buildArticlePayload } from "../../../src/lib/editor-payload.js";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "sqlite::memory:";
process.env.DB_DIALECT = "sqlite";
process.env.JWT_SECRET = "editor-profile-secret";

const { sequelize, User, Article } = await import(
  "../../../src/lib/db/index.js"
);
const { register } = await import("../../../src/lib/services/users.js");
const articles = await import("../../../src/lib/services/articles.js");
const { getProfilePage } = await import(
  "../../../src/lib/services/profile-page.js"
);

async function user(username) {
  await register({
    username,
    email: `${username}@conduit.io`,
    password: "sup3rsecret",
  });
  return User.findOne({ where: { username } });
}

describe("buildArticlePayload", () => {
  it("parses a comma tag string into a de-blanked array", () => {
    const p = buildArticlePayload({
      title: "My Post",
      description: "d",
      body: "b",
      tags: "react, next ,  , go",
    });
    expect(p.article.title).toBe("My Post");
    expect(p.article.tagList).toEqual(["react", "next", "go"]);
  });

  it("produces an empty tag list for an empty tag string", () => {
    expect(
      buildArticlePayload({ title: "t", description: "d", body: "b", tags: "" })
        .article.tagList,
    ).toEqual([]);
  });
});

describe("getProfilePage", () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });
  beforeEach(async () => {
    await sequelize.sync({ force: true });
  });

  it("returns the profile + the user's own articles", async () => {
    const amy = await user("amy");
    await articles.create(amy, { title: "one", description: "d", body: "b" });
    await articles.create(amy, { title: "two", description: "d", body: "b" });
    const { profile, articles: own } = await getProfilePage("amy", null);
    expect(profile.username).toBe("amy");
    expect(own).toHaveLength(2);
  });

  it("includes the user's favorited articles", async () => {
    const ben = await user("ben");
    await articles.create(ben, { title: "x", description: "d", body: "b" });
    const cara = await user("cara");
    // Favorite via the model association directly (Story 1.8 does not depend on the
    // favorites service from Story 1.5).
    const x = await Article.findOne({ where: { slug: "x" } });
    await x.addUser(cara);
    const { favorited } = await getProfilePage("cara", null);
    expect(favorited).toHaveLength(1);
    expect(favorited[0].title).toBe("x");
  });

  it("reflects the viewer's following flag", async () => {
    const dan = await user("dan");
    await articles.create(dan, { title: "post", description: "d", body: "b" });
    const eve = await user("eve");
    await dan.addFollower(eve);
    const { profile } = await getProfilePage("dan", eve);
    expect(profile.following).toBe(true);
  });

  it("throws NotFoundError for an unknown user", async () => {
    await expect(getProfilePage("ghost", null)).rejects.toThrow(/not found/);
  });
});
