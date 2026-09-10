// Step definitions for spec/behavior/story-1.7.feature (B1).
// Bound to the feed-params resolver + the home-page/article-page assemblers.

import { Given, When, Then, Before, BeforeAll } from "@cucumber/cucumber";
import assert from "node:assert/strict";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "sqlite::memory:";
process.env.DB_DIALECT = "sqlite";
process.env.JWT_SECRET = "home-article-behaviour-secret";

const { sequelize, User, Comment, Article } = await import(
  "../../../src/lib/db/index.js"
);
const { register } = await import("../../../src/lib/services/users.js");
const articles = await import("../../../src/lib/services/articles.js");
const { resolveFeed } = await import("../../../src/lib/feed-params.js");
const { getHomePage } = await import("../../../src/lib/services/home-page.js");
const { getArticlePage } = await import(
  "../../../src/lib/services/article-page.js"
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
  /^an author "([^"]*)" with articles "([^"]*)" and "([^"]*)" tagged "([^"]*)"$/,
  async function (username, a, b, tag) {
    const u = await mk(this, username);
    await articles.create(u, { title: a, description: "d", body: "b", tagList: [tag] });
    await articles.create(u, { title: b, description: "d", body: "b", tagList: [tag] });
  },
);

Given(
  /^an author "([^"]*)" with an article "([^"]*)" tagged "([^"]*)"$/,
  async function (username, a, tag) {
    const u = await mk(this, username);
    await articles.create(u, { title: a, description: "d", body: "b", tagList: [tag] });
  },
);

Given(
  /^an author "([^"]*)" with an article "([^"]*)"$/,
  async function (username, a) {
    const u = await mk(this, username);
    await articles.create(u, { title: a, description: "d", body: "b" });
  },
);

Given(
  /^"([^"]*)" has a comment "([^"]*)" by "([^"]*)"$/,
  async function (slug, body, username) {
    const u = await mk(this, username);
    const art = await Article.findOne({ where: { slug } });
    await Comment.create({ body, articleId: art.id, userId: u.id });
  },
);

When(
  /^the feed is resolved from no search params for an anonymous viewer$/,
  function () {
    this.result.feed = resolveFeed({}, false);
  },
);

When(
  /^the feed is resolved from search params with tag "([^"]*)"$/,
  function (tag) {
    this.result.feed = resolveFeed({ tag }, false);
  },
);

When(
  /^the feed is resolved from search params with feed "([^"]*)" for a signed-in viewer$/,
  function (feed) {
    this.result.feed = resolveFeed({ feed }, true);
  },
);

When(
  /^the feed is resolved from search params with feed "([^"]*)" for an anonymous viewer$/,
  function (feed) {
    this.result.feed = resolveFeed({ feed }, false);
  },
);

When(
  /^the home page is assembled with no search params for an anonymous viewer$/,
  async function () {
    this.result.value = await getHomePage({}, null);
  },
);

When(
  /^the home page is assembled with tag "([^"]*)" for an anonymous viewer$/,
  async function (tag) {
    this.result.value = await getHomePage({ tag }, null);
  },
);

When(
  /^the article page for "([^"]*)" is assembled for an anonymous viewer$/,
  async function (slug) {
    try {
      this.result.value = await getArticlePage(slug, null);
    } catch (e) {
      this.error = e;
    }
  },
);

Then(/^the feed mode is "([^"]*)"$/, function (mode) {
  assert.equal(this.result.feed.mode, mode);
});

Then(/^the resolved tag is "([^"]*)"$/, function (tag) {
  assert.equal(this.result.feed.tag, tag);
});

Then(/^the home page shows (\d+) articles?$/, function (n) {
  assert.equal(this.result.value.articles.length, Number(n));
});

Then(/^the home page popular tags include "([^"]*)"$/, function (tag) {
  assert.ok(this.result.value.tags.includes(tag));
});

Then(/^the article page article is "([^"]*)"$/, function (slug) {
  assert.equal(this.result.value.article.slug, slug);
});

Then(/^the article page shows (\d+) comment$/, function (n) {
  assert.equal(this.result.value.comments.length, Number(n));
});

Then(/^the article page request is rejected as not found$/, function () {
  assert.ok(this.error);
  assert.equal(this.error.name, "NotFoundError");
});
