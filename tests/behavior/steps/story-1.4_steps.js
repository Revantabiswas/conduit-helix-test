// Step definitions for spec/behavior/story-1.4.feature (B1).
// Bound to the articles + tags services public surface.

import { Given, When, Then, Before, BeforeAll } from "@cucumber/cucumber";
import assert from "node:assert/strict";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "sqlite::memory:";
process.env.DB_DIALECT = "sqlite";
process.env.JWT_SECRET = "articles-behaviour-secret";

const { sequelize, User } = await import("../../../src/lib/db/index.js");
const { register } = await import("../../../src/lib/services/users.js");
const articles = await import("../../../src/lib/services/articles.js");
const tags = await import("../../../src/lib/services/tags.js");

BeforeAll(async () => {
  await sequelize.sync({ force: true });
});
Before(async function () {
  await sequelize.sync({ force: true });
  this.authors = {};
  this.result = {};
  this.error = null;
});

async function mkAuthor(ctx, username) {
  await register({
    username,
    email: `${username}@conduit.io`,
    password: "sup3rsecret",
  });
  const u = await User.findOne({ where: { username } });
  ctx.authors[username] = u;
  return u;
}

Given(/^a registered author "([^"]*)"$/, async function (username) {
  await mkAuthor(this, username);
});

Given(
  /^"([^"]*)" has created an article titled "([^"]*)"(?: with tags "([^"]*)")?$/,
  async function (username, title, tagCsv) {
    const tagList = tagCsv ? tagCsv.split(",").map((t) => t.trim()) : [];
    await articles.create(this.authors[username], {
      title,
      description: "d",
      body: "b",
      tagList,
    });
  },
);

Given(/^"([^"]*)" has created (\d+) articles$/, async function (username, n) {
  for (let i = 0; i < Number(n); i++) {
    await articles.create(this.authors[username], {
      title: `Post ${i}`,
      description: "d",
      body: "b",
      tagList: ["t"],
    });
  }
});

Given(/^"([^"]*)" follows "([^"]*)"$/, async function (a, b) {
  await this.authors[b].addFollower(this.authors[a]);
});

When(
  /^"([^"]*)" creates an article titled "([^"]*)" with tags "([^"]*)"$/,
  async function (username, title, tagCsv) {
    this.result.value = await articles.create(this.authors[username], {
      title,
      description: "d",
      body: "b",
      tagList: tagCsv.split(",").map((t) => t.trim()),
    });
  },
);

When(/^"([^"]*)" creates an article with no title$/, async function (username) {
  try {
    await articles.create(this.authors[username], {
      description: "d",
      body: "b",
    });
  } catch (e) {
    this.error = e;
  }
});

When(/^the global article list is requested$/, async function () {
  this.result.value = await articles.list({}, null);
});

When(
  /^the global article list is requested with query counting on$/,
  async function () {
    const { sequelize: seq } = await import(
      "../../../src/lib/services/articles.js"
    );
    let count = 0;
    const orig = seq.query.bind(seq);
    seq.query = (...args) => {
      count++;
      return orig(...args);
    };
    await articles.list({}, Object.values(this.authors)[0]);
    seq.query = orig;
    this.result.queryCount = count;
  },
);

When(/^the article list is filtered by tag "([^"]*)"$/, async function (tag) {
  this.result.value = await articles.list({ tag }, null);
});

When(/^the article "([^"]*)" is requested$/, async function (slug) {
  try {
    this.result.value = await articles.get(slug, null);
  } catch (e) {
    this.error = e;
  }
});

When(
  /^"([^"]*)" updates the article "([^"]*)" body to "([^"]*)"$/,
  async function (username, slug, body) {
    this.result.value = await articles.update(slug, this.authors[username], {
      body,
    });
  },
);

When(
  /^"([^"]*)" tries to update the article "([^"]*)"$/,
  async function (username, slug) {
    try {
      await articles.update(slug, this.authors[username], { body: "x" });
    } catch (e) {
      this.error = e;
    }
  },
);

When(/^"([^"]*)" deletes the article "([^"]*)"$/, async function (username, slug) {
  await articles.del(slug, this.authors[username]);
});

When(/^"([^"]*)" requests the personal feed$/, async function (username) {
  this.result.value = await articles.feed(this.authors[username], {});
});

When(/^the tag list is requested$/, async function () {
  this.result.value = await tags.list();
});

Then(
  /^the article has slug "([^"]*)" and author "([^"]*)"$/,
  function (slug, username) {
    assert.equal(this.result.value.article.slug, slug);
    assert.equal(this.result.value.article.author.username, username);
  },
);

Then(
  /^the article tag list contains "([^"]*)" and "([^"]*)"$/,
  function (a, b) {
    const tl = this.result.value.article.tagList;
    assert.ok(tl.includes(a));
    assert.ok(tl.includes(b));
  },
);

Then(/^the article count is (\d+)$/, function (n) {
  assert.equal(this.result.value.articlesCount, Number(n));
});

Then(/^the first listed article is titled "([^"]*)"$/, function (title) {
  assert.equal(this.result.value.articles[0].title, title);
});

Then(/^the number of database queries is at most (\d+)$/, function (n) {
  assert.ok(
    this.result.queryCount <= Number(n),
    `expected <= ${n} queries, got ${this.result.queryCount}`,
  );
});

Then(/^the article request is rejected as not found$/, function () {
  assert.ok(this.error);
  assert.equal(this.error.name, "NotFoundError");
});

Then(/^the article body is "([^"]*)"$/, function (body) {
  assert.equal(this.result.value.article.body, body);
});

Then(/^the update is rejected as forbidden$/, function () {
  assert.ok(this.error);
  assert.equal(this.error.name, "ForbiddenError");
});

Then(/^the article "([^"]*)" no longer exists$/, async function (slug) {
  await assert.rejects(() => articles.get(slug, null), /not found/);
});

Then(/^the creation is rejected with a validation error$/, function () {
  assert.ok(this.error);
  assert.ok(/required/.test(this.error.message));
});

Then(/^the feed count is (\d+)$/, function (n) {
  assert.equal(this.result.value.articlesCount, Number(n));
});

Then(/^the first feed article is titled "([^"]*)"$/, function (title) {
  assert.equal(this.result.value.articles[0].title, title);
});

Then(/^the tag list contains "([^"]*)" and "([^"]*)"$/, function (a, b) {
  assert.ok(this.result.value.tags.includes(a));
  assert.ok(this.result.value.tags.includes(b));
});
