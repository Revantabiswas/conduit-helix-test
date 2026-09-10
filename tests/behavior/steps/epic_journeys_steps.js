// Step definitions for spec/behavior.feature (B3 epic-scope journeys).
// Exercise the full migrated backend end to end through the composed services.

import { Given, When, Then, Before, BeforeAll } from "@cucumber/cucumber";
import assert from "node:assert/strict";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "sqlite::memory:";
process.env.DB_DIALECT = "sqlite";
process.env.JWT_SECRET = "epic-journeys-secret";

const { sequelize, User } = await import("../../../src/lib/db/index.js");
const users = await import("../../../src/lib/services/users.js");
const articlesSvc = await import("../../../src/lib/services/articles.js");
const profilesSvc = await import("../../../src/lib/services/profiles.js");
const favoritesSvc = await import("../../../src/lib/services/favorites.js");
const commentsSvc = await import("../../../src/lib/services/comments.js");
const tagsSvc = await import("../../../src/lib/services/tags.js");
const { verifySession } = await import("../../../src/lib/auth.js");

BeforeAll(async () => {
  await sequelize.sync({ force: true });
});
Before(async function () {
  await sequelize.sync({ force: true });
  this.users = {};
  this.tokens = {};
  this.result = {};
});

async function userModel(username) {
  return User.findOne({ where: { username } });
}

Given(/^a fresh Conduit system$/, async function () {
  // schema already reset in Before
});

Given(
  /^an author "([^"]*)" with a published article "([^"]*)"$/,
  async function (username, title) {
    const { token } = await users.register({
      username,
      email: `${username}@conduit.io`,
      password: "sup3rsecret",
    });
    this.tokens[username] = token;
    this.users[username] = await userModel(username);
    await articlesSvc.create(this.users[username], {
      title,
      description: "d",
      body: "b",
    });
  },
);

When(
  /^a new user "([^"]*)" registers and logs in$/,
  async function (username) {
    await users.register({
      username,
      email: `${username}@conduit.io`,
      password: "sup3rsecret",
    });
    const { token } = await users.login({
      email: `${username}@conduit.io`,
      password: "sup3rsecret",
    });
    this.tokens[username] = token;
    this.users[username] = await userModel(username);
  },
);

When(
  /^"([^"]*)" publishes an article "([^"]*)" tagged "([^"]*)"$/,
  async function (username, title, tag) {
    await articlesSvc.create(this.users[username], {
      title,
      description: "d",
      body: "b",
      tagList: [tag],
    });
  },
);

When(/^"([^"]*)" starts following "([^"]*)"$/, async function (a, b) {
  await profilesSvc.toggleFollow(b, this.users[a], true);
});

When(
  /^"([^"]*)" adds the article "([^"]*)" to favorites$/,
  async function (username, slug) {
    await favoritesSvc.toggle(slug, this.users[username], true);
  },
);

When(
  /^"([^"]*)" leaves the comment "([^"]*)" on the article "([^"]*)"$/,
  async function (username, body, slug) {
    await commentsSvc.create(slug, this.users[username], body);
  },
);

When(
  /^"([^"]*)" revises the article "([^"]*)" body to "([^"]*)"$/,
  async function (username, slug, body) {
    this.result.updated = await articlesSvc.update(slug, this.users[username], {
      body,
    });
  },
);

When(
  /^"([^"]*)" removes the article "([^"]*)"$/,
  async function (username, slug) {
    await articlesSvc.del(slug, this.users[username]);
  },
);

Then(
  /^the global feed contains "([^"]*)" by "([^"]*)"$/,
  async function (title, username) {
    const { articles } = await articlesSvc.list({}, null);
    const found = articles.find((a) => a.title === title);
    assert.ok(found, `expected "${title}" in the global feed`);
    assert.equal(found.author.username, username);
  },
);

Then(/^the tag list includes "([^"]*)"$/, async function (tag) {
  const { tags } = await tagsSvc.list();
  assert.ok(tags.includes(tag));
});

Then(
  /^"([^"]*)"'s personal feed contains "([^"]*)"$/,
  async function (username, title) {
    const { articles } = await articlesSvc.feed(this.users[username], {});
    assert.ok(articles.some((a) => a.title === title));
  },
);

Then(
  /^the article "([^"]*)" has (\d+) favorite and (\d+) comment$/,
  async function (slug, favs, comments) {
    const { article } = await articlesSvc.get(slug, null);
    assert.equal(article.favoritesCount, Number(favs));
    const { comments: list } = await commentsSvc.list(slug);
    assert.equal(list.length, Number(comments));
  },
);

Then(
  /^the profile of "([^"]*)" as seen by "([^"]*)" shows following true$/,
  async function (target, viewer) {
    const { profile } = await profilesSvc.getProfile(
      target,
      this.users[viewer],
    );
    assert.equal(profile.following, true);
  },
);

Then(/^the article "([^"]*)" body is "([^"]*)"$/, function (slug, body) {
  assert.equal(this.result.updated.article.body, body);
});

Then(
  /^the global feed no longer contains "([^"]*)"$/,
  async function (slug) {
    const { articles } = await articlesSvc.list({}, null);
    assert.ok(!articles.some((a) => a.slug === slug));
  },
);

Then(
  /^the session token for "([^"]*)" resolves to the current user "([^"]*)"$/,
  function (username, expected) {
    const claims = verifySession(this.tokens[username]);
    assert.equal(claims.email, `${expected}@conduit.io`);
  },
);
