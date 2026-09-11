// Step definitions for spec/behavior/story-1.1.feature (B1).
// Bound to the PUBLIC surface of the DB layer (exported models, sequelize instance,
// resolveDbConfig) — never to internals. Uses in-memory SQLite so no external DB is required.

import { Given, When, Then, Before } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Sequelize, DataTypes } from "sequelize";

import defineUser from "../../../src/lib/db/models/User.js";
import defineArticle from "../../../src/lib/db/models/Article.js";
import defineTag from "../../../src/lib/db/models/Tag.js";
import defineComment from "../../../src/lib/db/models/Comment.js";
import { resolveDbConfig } from "../../../src/lib/db/config.js";

function repoPath(rel) {
  return fileURLToPath(new URL(`../../../${rel}`, import.meta.url));
}

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

Before(function () {
  this.db = null;
  this.result = {};
});

// ---- AC-1: scaffold exists, legacy untouched ----
Given(/^the repository has an existing backend\/ and frontend\/ workspace$/, function () {
  assert.ok(existsSync(repoPath("backend")), "backend/ should exist");
  assert.ok(existsSync(repoPath("frontend")), "frontend/ should exist");
});

When(/^the Next\.js application is scaffolded under src\/$/, function () {
  this.result.srcExists = existsSync(repoPath("src/app"));
});

Then(/^the src\/ directory contains a Next\.js 15 App Router structure$/, function () {
  assert.ok(this.result.srcExists, "src/app should exist");
  assert.ok(existsSync(repoPath("src/app/layout.js")), "layout.js should exist");
  // A home page exists at the App Router root — either src/app/page.js (Story 1.1's
  // placeholder) or src/app/(home)/page.js (where Story 1.7 moved the real Home page).
  const hasHome =
    existsSync(repoPath("src/app/page.js")) ||
    existsSync(repoPath("src/app/(home)/page.js"));
  assert.ok(hasHome, "a home page.js should exist at the App Router root");
});

Then(/^the existing backend\/ and frontend\/ directories are unchanged$/, function () {
  // Foundational story adds only src/; assert the legacy entry points still exist.
  assert.ok(existsSync(repoPath("backend/index.js")));
  assert.ok(existsSync(repoPath("frontend/src/main.jsx")));
});

Then(/^ESLint and Prettier are configured for the src\/ app in JavaScript$/, function () {
  assert.ok(existsSync(repoPath("eslint.config.js")));
  assert.ok(existsSync(repoPath(".prettierrc")));
});

// ---- AC-2: models ported with associations ----
Given(
  /^the Sequelize models from backend\/models are ported into src\/lib\/db\/models$/,
  function () {
    const files = readdirSync(repoPath("src/lib/db/models"));
    assert.ok(files.includes("User.js"));
    assert.ok(files.includes("Article.js"));
    assert.ok(files.includes("Tag.js"));
    assert.ok(files.includes("Comment.js"));
  },
);

When("the models are loaded", function () {
  this.db = buildDb();
});

Then("the models Article, User, Tag, and Comment are all defined", function () {
  assert.ok(this.db.Article && this.db.User && this.db.Tag && this.db.Comment);
});

Then(
  "the User model has the Favorites, followers, and following associations",
  function () {
    assert.ok(this.db.User.associations.favorites);
    assert.ok(this.db.User.associations.followers);
    assert.ok(this.db.User.associations.following);
  },
);

Then(
  "the Article model has the tagList, author, and comments associations",
  function () {
    assert.ok(this.db.Article.associations.tagList);
    assert.ok(this.db.Article.associations.author);
    const hasComments = Object.values(this.db.Article.associations).some(
      (a) => a.target === this.db.Comment,
    );
    assert.ok(hasComments);
  },
);

// ---- AC-3: singleton ----
Given("the DB layer initialises Sequelize via a singleton pattern", function () {
  // Assert the exported index source uses a global stash for the instance.
  const src = readFileSync(repoPath("src/lib/db/index.js"), "utf8");
  assert.ok(/globalThis/.test(src) && /__conduitDb/.test(src));
});

When(
  "the DB layer module is loaded more than once in the same process",
  async function () {
    process.env.DATABASE_URL = "sqlite::memory:";
    process.env.DB_DIALECT = "sqlite";
    process.env.NODE_ENV = "development";
    delete globalThis.__conduitDb;
    const first = await import(
      `../../../src/lib/db/index.js?bust=${Date.now()}-a`
    );
    const second = await import(
      `../../../src/lib/db/index.js?bust=${Date.now()}-b`
    );
    this.result.first = first.default.sequelize;
    this.result.second = second.default.sequelize;
  },
);

Then("the same Sequelize instance is returned each time", function () {
  assert.equal(this.result.second, this.result.first);
});

Then("no additional connection pool is created on the second load", function () {
  assert.ok(globalThis.__conduitDb, "instance is stashed globally");
});

// ---- AC-4: config from env ----
Given(
  /^a DATABASE_URL \(or DB_\* variables\) is present in the environment$/,
  function () {
    process.env.DATABASE_URL = "postgres://u:p@h:5432/conduit";
  },
);

When("the DB config is resolved", function () {
  this.result.cfg = resolveDbConfig();
});

Then("the Sequelize connection uses the values from the environment", function () {
  assert.equal(this.result.cfg.url, "postgres://u:p@h:5432/conduit");
});

Then("no database credentials are hardcoded in the config module", function () {
  const src = readFileSync(repoPath("src/lib/db/config.js"), "utf8");
  // Every value must come from process.env — assert there is no literal password assignment.
  assert.ok(/process\.env/.test(src));
  assert.ok(!/password\s*[:=]\s*["'][^"']+["']/.test(src));
});

// ---- AC-5: boot, connect, queryable associations ----
Given("a reachable PostgreSQL database", function () {
  // Substituted by in-memory SQLite for a self-contained behaviour run.
  this.db = buildDb();
});

When("the DB layer authenticates the connection", async function () {
  await this.db.sequelize.authenticate();
  this.result.authed = true;
});

Then("the connection succeeds without error", function () {
  assert.ok(this.result.authed);
});

Then(
  /^a smoke query that includes an association \(for example Article with Tag and User\) executes without error$/,
  async function () {
    await this.db.sequelize.sync({ force: true });
    const author = await this.db.User.create({
      email: "a@b.c",
      username: "author",
      password: "h",
    });
    const article = await this.db.Article.create({
      slug: "s",
      title: "t",
      description: "d",
      body: "b",
      userId: author.id,
    });
    const tag = await this.db.Tag.create({ name: "react" });
    await article.addTagList(tag);
    const loaded = await this.db.Article.findOne({
      where: { slug: "s" },
      include: [
        { model: this.db.Tag, as: "tagList" },
        { model: this.db.User, as: "author" },
      ],
    });
    assert.equal(loaded.author.username, "author");
    assert.ok(loaded.tagList.some((t) => t.name === "react"));
  },
);
