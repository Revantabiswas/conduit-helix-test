// Step definitions for spec/behavior/story-1.3.feature (B1).
// Bound to the user + profiles services public surface.

import { Given, When, Then, Before, BeforeAll } from "@cucumber/cucumber";
import assert from "node:assert/strict";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "sqlite::memory:";
process.env.DB_DIALECT = "sqlite";
process.env.JWT_SECRET = "profiles-behaviour-secret";

const { sequelize, User } = await import("../../../src/lib/db/index.js");
const { register } = await import("../../../src/lib/services/users.js");
const userService = await import("../../../src/lib/services/user.js");
const profiles = await import("../../../src/lib/services/profiles.js");
const { requireSessionUser } = await import("../../../src/lib/auth.js");

BeforeAll(async () => {
  await sequelize.sync({ force: true });
});
Before(async function () {
  await User.destroy({ where: {}, truncate: true });
  this.users = {};
  this.result = {};
  this.error = null;
});

async function mkUser(ctx, email, username) {
  await register({ username, email, password: "sup3rsecret" });
  const u = await User.findOne({ where: { username } });
  ctx.users[username] = u;
  return u;
}

Given(
  /^a registered user with email "([^"]*)" and username "([^"]*)"$/,
  async function (email, username) {
    await mkUser(this, email, username);
  },
);

Given(/^no user exists with username "([^"]*)"$/, async function (username) {
  await User.destroy({ where: { username } });
});

Given(/^no authenticated user$/, function () {
  this.noAuth = true;
});

Given(/^"([^"]*)" already follows "([^"]*)"$/, async function (a, b) {
  await profiles.toggleFollow(b, this.users[a], true);
});

When(/^that user requests the current user$/, function () {
  const only = Object.values(this.users)[0];
  this.result.value = userService.getCurrent(only);
});

When(
  /^that user updates their bio to "([^"]*)" and image to "([^"]*)"$/,
  async function (bio, image) {
    const only = Object.values(this.users)[0];
    this.result.value = await userService.update(only, { bio, image });
  },
);

When(/^an anonymous visitor views the profile of "([^"]*)"$/, async function (username) {
  try {
    this.result.value = await profiles.getProfile(username, null);
  } catch (e) {
    this.error = e;
  }
});

When(/^"([^"]*)" follows "([^"]*)"$/, async function (a, b) {
  try {
    this.result.value = await profiles.toggleFollow(b, this.users[a], true);
  } catch (e) {
    this.error = e;
  }
});

When(/^"([^"]*)" unfollows "([^"]*)"$/, async function (a, b) {
  this.result.value = await profiles.toggleFollow(b, this.users[a], false);
});

When(
  /^an update to the current user is attempted without a session$/,
  async function () {
    try {
      const req = new Request("http://x/api/user");
      await requireSessionUser(req);
    } catch (e) {
      this.error = e;
    }
  },
);

Then(
  /^the current user has email "([^"]*)" and username "([^"]*)"$/,
  function (email, username) {
    assert.equal(this.result.value.user.email, email);
    assert.equal(this.result.value.user.username, username);
  },
);

Then(
  /^the current user has bio "([^"]*)" and image "([^"]*)"$/,
  function (bio, image) {
    assert.equal(this.result.value.user.bio, bio);
    assert.equal(this.result.value.user.image, image);
  },
);

Then(
  /^the profile has username "([^"]*)" and following is false$/,
  function (username) {
    assert.equal(this.result.value.profile.username, username);
    assert.equal(this.result.value.profile.following, false);
  },
);

Then(/^the profile request is rejected as not found$/, function () {
  assert.ok(this.error);
  assert.equal(this.error.name, "NotFoundError");
});

Then(
  /^the profile of "([^"]*)" as seen by "([^"]*)" has following true$/,
  async function (target, viewer) {
    const { profile } = await profiles.getProfile(target, this.users[viewer]);
    assert.equal(profile.following, true);
  },
);

Then(
  /^the profile of "([^"]*)" as seen by "([^"]*)" has following false$/,
  async function (target, viewer) {
    const { profile } = await profiles.getProfile(target, this.users[viewer]);
    assert.equal(profile.following, false);
  },
);

Then(/^the follower count of "([^"]*)" is (\d+)$/, async function (target, n) {
  const { profile } = await profiles.getProfile(target, null);
  assert.equal(profile.followersCount, Number(n));
});

Then(/^the request is rejected as unauthorized$/, function () {
  assert.ok(this.error);
  assert.equal(this.error.name, "UnauthorizedError");
});

Then(/^the follow is rejected with a validation error$/, function () {
  assert.ok(this.error);
  assert.equal(this.error.name, "ValidationError");
});
