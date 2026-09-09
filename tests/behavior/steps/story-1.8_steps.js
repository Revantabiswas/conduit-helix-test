// Step definitions for spec/behavior/story-1.8.feature (B1).
// Bound to the editor payload builder + the profile-page data assembler.
// Favorite/follow setup uses model associations directly (Story 1.8 does not depend on 1.5).

import { Given, When, Then, Before, BeforeAll } from "@cucumber/cucumber";
import assert from "node:assert/strict";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "sqlite::memory:";
process.env.DB_DIALECT = "sqlite";
process.env.JWT_SECRET = "editor-profile-behaviour-secret";

const { sequelize, User, Article } = await import(
  "../../../src/lib/db/index.js"
);
const { register } = await import("../../../src/lib/services/users.js");
const articles = await import("../../../src/lib/services/articles.js");
const { buildArticlePayload } = await import(
  "../../../src/lib/editor-payload.js"
);
const { getProfilePage } = await import(
  "../../../src/lib/services/profile-page.js"
);

BeforeAll(async () => {
  await sequelize.sync({ force: true });
});
Before(async function () {
  await sequelize.sync({ force: true });
  this.users = {};
  this.result = {};
  this.error = null;
});

async function mk(ctx, username) {
  await register({
    username,
    email: `${username}@conduit.io`,
    password: "sup3rsecret",
  });
  const u = await User.findOne({ where: { username } });
  ctx.users[username] = u;
  return u;
}

Given(
  /^a registered author "([^"]*)" with articles "([^"]*)" and "([^"]*)"$/,
  async function (username, a, b) {
    const u = await mk(this, username);
    await articles.create(u, { title: a, description: "d", body: "b" });
    await articles.create(u, { title: b, description: "d", body: "b" });
  },
);

Given(
  /^a registered author "([^"]*)" with articles "([^"]*)"$/,
  async function (username, a) {
    const u = await mk(this, username);
    await articles.create(u, { title: a, description: "d", body: "b" });
  },
);

Given(
  /^a registered reader "([^"]*)" who has favorited "([^"]*)"$/,
  async function (username, slug) {
    const u = await mk(this, username);
    const art = await Article.findOne({ where: { slug } });
    await art.addUser(u);
  },
);

Given(
  /^a registered reader "([^"]*)" who follows "([^"]*)"$/,
  async function (reader, target) {
    const u = await mk(this, reader);
    await this.users[target].addFollower(u);
  },
);

When(
  /^the editor form is submitted with title "([^"]*)", description "([^"]*)", body "([^"]*)" and tags "([^"]*)"$/,
  function (title, description, body, tags) {
    this.result.payload = buildArticlePayload({ title, description, body, tags });
  },
);

When(
  /^the profile page for "([^"]*)" is assembled for an anonymous viewer$/,
  async function (username) {
    try {
      this.result.value = await getProfilePage(username, null);
    } catch (e) {
      this.error = e;
    }
  },
);

When(
  /^the profile page for "([^"]*)" is assembled for viewer "([^"]*)"$/,
  async function (username, viewer) {
    this.result.value = await getProfilePage(username, this.users[viewer]);
  },
);

Then(
  /^the article payload has title "([^"]*)" and tag list "([^"]*)" and "([^"]*)"$/,
  function (title, a, b) {
    assert.equal(this.result.payload.article.title, title);
    assert.ok(this.result.payload.article.tagList.includes(a));
    assert.ok(this.result.payload.article.tagList.includes(b));
  },
);

Then(/^the article payload has an empty tag list$/, function () {
  assert.deepEqual(this.result.payload.article.tagList, []);
});

Then(/^the profile is for "([^"]*)"$/, function (username) {
  assert.equal(this.result.value.profile.username, username);
});

Then(
  /^the profile page lists (\d+) of the user's own articles$/,
  function (n) {
    assert.equal(this.result.value.articles.length, Number(n));
  },
);

Then(/^the profile page lists (\d+) favorited article$/, function (n) {
  assert.equal(this.result.value.favorited.length, Number(n));
});

Then(/^the profile following flag is true$/, function () {
  assert.equal(this.result.value.profile.following, true);
});

Then(/^the profile page request is rejected as not found$/, function () {
  assert.ok(this.error);
  assert.equal(this.error.name, "NotFoundError");
});
