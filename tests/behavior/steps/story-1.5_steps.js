// Step definitions for spec/behavior/story-1.5.feature (B1).
// Bound to the favorites + comments services public surface.

import { Given, When, Then, Before, BeforeAll } from "@cucumber/cucumber";
import assert from "node:assert/strict";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "sqlite::memory:";
process.env.DB_DIALECT = "sqlite";
process.env.JWT_SECRET = "fav-comment-behaviour-secret";

const { sequelize, User } = await import("../../../src/lib/db/index.js");
const { register } = await import("../../../src/lib/services/users.js");
const articles = await import("../../../src/lib/services/articles.js");
const favorites = await import("../../../src/lib/services/favorites.js");
const comments = await import("../../../src/lib/services/comments.js");

BeforeAll(async () => {
  await sequelize.sync({ force: true });
});
Before(async function () {
  await sequelize.sync({ force: true });
  this.users = {};
  this.commentIds = {};
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
  /^a registered author "([^"]*)" with an article "([^"]*)"$/,
  async function (username, slug) {
    const u = await mk(this, username);
    await articles.create(u, { title: slug, description: "d", body: "b" });
  },
);

Given(/^a registered reader "([^"]*)"$/, async function (username) {
  await mk(this, username);
});

Given(
  /^"([^"]*)" has favorited the article "([^"]*)"$/,
  async function (username, slug) {
    await favorites.toggle(slug, this.users[username], true);
  },
);

Given(
  /^"([^"]*)" has commented "([^"]*)" on the article "([^"]*)"$/,
  async function (username, body, slug) {
    const { comment } = await comments.create(slug, this.users[username], body);
    this.commentIds[`${username}:${slug}`] = comment.id;
  },
);

When(
  /^"([^"]*)" favorites the article "([^"]*)"$/,
  async function (username, slug) {
    try {
      this.result.value = await favorites.toggle(slug, this.users[username], true);
    } catch (e) {
      this.error = e;
    }
  },
);

When(
  /^"([^"]*)" unfavorites the article "([^"]*)"$/,
  async function (username, slug) {
    this.result.value = await favorites.toggle(slug, this.users[username], false);
  },
);

When(
  /^"([^"]*)" comments "([^"]*)" on the article "([^"]*)"$/,
  async function (username, body, slug) {
    try {
      this.result.value = await comments.create(slug, this.users[username], body);
    } catch (e) {
      this.error = e;
    }
  },
);

When(/^the comments for article "([^"]*)" are listed$/, async function (slug) {
  this.result.value = await comments.list(slug);
});

When(
  /^"([^"]*)" deletes their comment on "([^"]*)"$/,
  async function (username, slug) {
    const id = this.commentIds[`${username}:${slug}`];
    await comments.del(slug, id, this.users[username]);
  },
);

When(
  /^"([^"]*)" tries to delete "([^"]*)"'s comment on "([^"]*)"$/,
  async function (actor, owner, slug) {
    const id = this.commentIds[`${owner}:${slug}`];
    try {
      await comments.del(slug, id, this.users[actor]);
    } catch (e) {
      this.error = e;
    }
  },
);

Then(
  /^the article "([^"]*)" is favorited by "([^"]*)" with favorites count (\d+)$/,
  function (slug, username, n) {
    assert.equal(this.result.value.article.favorited, true);
    assert.equal(this.result.value.article.favoritesCount, Number(n));
  },
);

Then(
  /^the article "([^"]*)" is not favorited by "([^"]*)" with favorites count (\d+)$/,
  function (slug, username, n) {
    assert.equal(this.result.value.article.favorited, false);
    assert.equal(this.result.value.article.favoritesCount, Number(n));
  },
);

Then(/^the article "([^"]*)" has (\d+) comments?$/, async function (slug, n) {
  const { comments: list } = await comments.list(slug);
  assert.equal(list.length, Number(n));
});

Then(
  /^the first comment body is "([^"]*)" by "([^"]*)"$/,
  async function (body, username) {
    // result of the create step
    assert.equal(this.result.value.comment.body, body);
    assert.equal(this.result.value.comment.author.username, username);
  },
);

Then(/^there is (\d+) comment authored by "([^"]*)"$/, function (n, username) {
  assert.equal(this.result.value.comments.length, Number(n));
  assert.equal(this.result.value.comments[0].author.username, username);
});

Then(/^the comment deletion is rejected as forbidden$/, function () {
  assert.ok(this.error);
  assert.equal(this.error.name, "ForbiddenError");
});

Then(/^the comment creation is rejected with a validation error$/, function () {
  assert.ok(this.error);
  assert.ok(/required/.test(this.error.message));
});

Then(/^the favorite request is rejected as not found$/, function () {
  assert.ok(this.error);
  assert.equal(this.error.name, "NotFoundError");
});
