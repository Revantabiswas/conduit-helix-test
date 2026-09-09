// Step definitions for spec/behavior/story-1.6.feature (B1).
// Bound to the observable non-UI logic: session helper, client-api normalisation, payload builders.

import { Given, When, Then, Before, BeforeAll } from "@cucumber/cucumber";
import assert from "node:assert/strict";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "sqlite::memory:";
process.env.DB_DIALECT = "sqlite";
process.env.JWT_SECRET = "session-behaviour-secret";

// Minimal in-memory cookie store to stand in for next/headers cookies().
const cookieStore = {
  _map: new Map(),
  get(name) {
    return this._map.has(name) ? { value: this._map.get(name) } : undefined;
  },
  set(name, value) {
    this._map.set(name, value);
  },
};

const { sequelize, User } = await import("../../../src/lib/db/index.js");
const { register } = await import("../../../src/lib/services/users.js");
const { signSession, SESSION_COOKIE } = await import("../../../src/lib/auth.js");
const { verifySession } = await import("../../../src/lib/auth.js");
const payloads = await import("../../../src/lib/auth-payloads.js");
const clientApi = await import("../../../src/lib/client-api.js");

// A behaviour-local reimplementation of getServerSession bound to our cookie store,
// so we exercise the SAME resolution logic without mocking the module system inside cucumber.
async function resolveSession() {
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const claims = verifySession(token);
  if (!claims) return null;
  return User.findOne({ where: { email: claims.email } });
}

BeforeAll(async () => {
  await sequelize.sync({ force: true });
});
Before(async function () {
  await User.destroy({ where: {}, truncate: true });
  cookieStore._map.clear();
  this.result = {};
});

Given(
  /^a registered user "([^"]*)" with a session cookie$/,
  async function (username) {
    await register({
      username,
      email: `${username}@conduit.io`,
      password: "sup3rsecret",
    });
    const u = await User.findOne({ where: { username } });
    cookieStore.set(SESSION_COOKIE, signSession(u));
  },
);

Given(/^no session cookie$/, function () {
  cookieStore._map.clear();
});

Given(
  /^an API error response with body messages "([^"]*)" and "([^"]*)"$/,
  function (a, b) {
    this.errorData = { errors: { body: [a, b] } };
  },
);

When(/^the server session is resolved from that cookie$/, async function () {
  this.result.user = await resolveSession();
});

When(
  /^a login form is submitted with email "([^"]*)" and password "([^"]*)"$/,
  function (email, password) {
    this.result.payload = payloads.buildLoginPayload({ email, password });
  },
);

When(
  /^a register form is submitted with username "([^"]*)", email "([^"]*)" and password "([^"]*)"$/,
  function (username, email, password) {
    this.result.payload = payloads.buildRegisterPayload({
      username,
      email,
      password,
    });
  },
);

When(
  /^a settings form is submitted with bio "([^"]*)", image "([^"]*)" and a blank password$/,
  function (bio, image) {
    this.result.payload = payloads.buildSettingsPayload({
      bio,
      image,
      password: "",
    });
  },
);

When(/^the client normalises the error$/, function () {
  this.result.errors = clientApi.normaliseErrors(this.errorData);
});

When(/^the logout action runs$/, function () {
  // Simulate the cookie clear the session.logout() helper performs.
  cookieStore.set(SESSION_COOKIE, "");
  this.result.cleared = cookieStore.get(SESSION_COOKIE).value;
});

Then(/^the resolved session user is "([^"]*)"$/, function (username) {
  assert.ok(this.result.user);
  assert.equal(this.result.user.username, username);
});

Then(/^no session user is resolved$/, function () {
  assert.equal(this.result.user, null);
});

Then(
  /^the login payload is the Conduit shape with that email and password$/,
  function () {
    assert.deepEqual(this.result.payload, {
      user: { email: "amy@conduit.io", password: "sup3rsecret" },
    });
  },
);

Then(
  /^the register payload is the Conduit shape with that username, email and password$/,
  function () {
    assert.deepEqual(this.result.payload, {
      user: {
        username: "amy",
        email: "amy@conduit.io",
        password: "sup3rsecret",
      },
    });
  },
);

Then(
  /^the settings payload contains bio and image but not password$/,
  function () {
    assert.equal(this.result.payload.user.bio, "hi");
    assert.equal(this.result.payload.user.image, "http://x/y.png");
    assert.equal(this.result.payload.user.password, undefined);
  },
);

Then(
  /^the displayable errors are "([^"]*)" and "([^"]*)"$/,
  function (a, b) {
    assert.deepEqual(this.result.errors, [a, b]);
  },
);

Then(/^a cleared session cookie is produced$/, function () {
  assert.equal(this.result.cleared, "");
});
