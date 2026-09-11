// Step definitions for spec/behavior/story-1.2.feature (B1).
// Bound to the public service surface (users service) + auth library — never to Route
// Handler HTTP internals. Uses in-memory SQLite via the DB singleton.

import { Given, When, Then, Before, BeforeAll } from "@cucumber/cucumber";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "sqlite::memory:";
process.env.DB_DIALECT = "sqlite";
process.env.JWT_SECRET = "behaviour-secret";

const { sequelize, User } = await import("../../../src/lib/db/index.js");
const { register, login } = await import(
  "../../../src/lib/services/users.js"
);
const auth = await import("../../../src/lib/auth.js");

BeforeAll(async () => {
  await sequelize.sync({ force: true });
});

Before(async function () {
  await User.destroy({ where: {}, truncate: true });
  this.result = {};
  this.error = null;
});

async function capture(ctx, fn) {
  try {
    ctx.result.value = await fn();
  } catch (e) {
    ctx.error = e;
  }
}

// ---- Givens ----
Given(/^no user exists with email "([^"]*)"$/, async function (email) {
  await User.destroy({ where: { email } });
});

Given(/^a user already exists with email "([^"]*)"$/, async function (email) {
  await register({
    username: "seed_" + Math.abs(hash(email)),
    email,
    password: "sup3rsecret",
  });
});

Given(/^a user already exists with username "([^"]*)"$/, async function (username) {
  await register({
    username,
    email: username + "@seed.io",
    password: "sup3rsecret",
  });
});

Given(
  /^a registered user with email "([^"]*)" and password "([^"]*)"$/,
  async function (email, password) {
    this.registered = await register({
      username: "u_" + Math.abs(hash(email)),
      email,
      password,
    });
  },
);

Given(/^a session token signed for that user$/, function () {
  this.token = this.registered.token;
});

Given(/^no session token is present$/, function () {
  this.token = undefined;
});

Given(/^the DB layer module$/, function () {
  // no-op; the source is inspected in the Then step
});

// ---- Whens ----
When(
  /^I register with username "([^"]*)", email "([^"]*)", and password "([^"]*)"$/,
  async function (username, email, password) {
    await capture(this, () => register({ username, email, password }));
  },
);

When(
  /^I log in with email "([^"]*)" and password "([^"]*)"$/,
  async function (email, password) {
    await capture(this, () => login({ email, password }));
  },
);

When(/^the session token is verified$/, function () {
  this.claims = auth.verifySession(this.token);
});

When(/^the session is resolved for a public request$/, async function () {
  const req = new Request("http://x/api");
  await capture(this, () => auth.getSessionUser(req));
});

When(/^its source is inspected$/, function () {
  const path = fileURLToPath(
    new URL("../../../src/lib/db/index.js", import.meta.url),
  );
  this.dbSource = readFileSync(path, "utf8");
});

// ---- Thens ----
Then(/^the registration succeeds$/, function () {
  assert.equal(this.error, null, this.error && this.error.message);
  assert.ok(this.result.value.user);
});

Then(
  /^the returned user has email "([^"]*)" and username "([^"]*)"$/,
  function (email, username) {
    assert.equal(this.result.value.user.email, email);
    assert.equal(this.result.value.user.username, username);
  },
);

Then(/^the returned user does not expose a password field$/, function () {
  assert.equal(this.result.value.user.password, undefined);
});

Then(/^a signed session token is produced for the user$/, function () {
  const token = this.result.value.token;
  assert.ok(token);
  assert.ok(auth.verifySession(token));
});

Then(/^the registration is rejected with a validation error$/, function () {
  assert.ok(this.error, "expected a validation error");
  assert.equal(this.error.name, "ValidationError");
});

Then(
  /^the registration is rejected because the email is already taken$/,
  function () {
    assert.ok(this.error);
    assert.match(this.error.message, /Email already exists/);
  },
);

Then(
  /^the registration is rejected because the username is already taken$/,
  function () {
    assert.ok(this.error);
    assert.match(this.error.message, /Username already exists/);
  },
);

Then(/^the login succeeds$/, function () {
  assert.equal(this.error, null, this.error && this.error.message);
  assert.ok(this.result.value.user);
});

Then(/^the login is rejected with a validation error$/, function () {
  assert.ok(this.error);
  assert.equal(this.error.name, "ValidationError");
});

Then(/^the login is rejected because the user is not found$/, function () {
  assert.ok(this.error);
  assert.equal(this.error.name, "NotFoundError");
});

Then(/^it resolves to the user with email "([^"]*)"$/, function (email) {
  assert.equal(this.claims.email, email);
});

Then(/^no user is resolved and no error is thrown$/, function () {
  assert.equal(this.error, null);
  assert.equal(this.result.value, null);
});

Then(/^it contains no schema-altering sync call$/, function () {
  assert.ok(!/sync\s*\(\s*\{[^}]*alter\s*:\s*true/.test(this.dbSource));
  assert.ok(!/sync\s*\(\s*\{[^}]*force\s*:\s*true/.test(this.dbSource));
});

function hash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}
