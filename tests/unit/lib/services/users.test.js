// Unit tests for the users service — register & login with tightened validation
// (Story 1.2, REQ-F-10). Uses the real DB layer pointed at in-memory SQLite.

import { describe, it, expect, beforeAll, beforeEach } from "vitest";

// Configure the DB singleton for SQLite BEFORE importing anything that loads it.
process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "sqlite::memory:";
process.env.DB_DIALECT = "sqlite";
process.env.JWT_SECRET = "test-secret";

const { sequelize, User } = await import("../../../../src/lib/db/index.js");
const { register, login } = await import(
  "../../../../src/lib/services/users.js"
);
const { verifySession } = await import("../../../../src/lib/auth.js");

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

beforeEach(async () => {
  await User.destroy({ where: {}, truncate: true });
});

describe("register", () => {
  it("creates a user, redacts the password, and issues a token", async () => {
    const { user, token } = await register({
      username: "alice",
      email: "alice@conduit.io",
      password: "sup3rsecret",
    });
    expect(user.email).toBe("alice@conduit.io");
    expect(user.username).toBe("alice");
    expect(user.password).toBeUndefined();
    expect(user.token).toBe(token);
    expect(verifySession(token).email).toBe("alice@conduit.io");
  });

  it("rejects a username shorter than 3 chars", async () => {
    await expect(
      register({ username: "al", email: "a@b.io", password: "sup3rsecret" }),
    ).rejects.toThrow(/Username must be/);
  });

  it("rejects an invalid email", async () => {
    await expect(
      register({ username: "alice", email: "nope", password: "sup3rsecret" }),
    ).rejects.toThrow(/valid email/);
  });

  it("rejects a password shorter than 8 chars", async () => {
    await expect(
      register({ username: "alice", email: "a@b.io", password: "short" }),
    ).rejects.toThrow(/at least 8/);
  });

  it("rejects missing fields", async () => {
    await expect(register({})).rejects.toThrow(/required/);
  });

  it("rejects a duplicate email", async () => {
    await register({
      username: "bob",
      email: "bob@conduit.io",
      password: "sup3rsecret",
    });
    await expect(
      register({
        username: "bobby",
        email: "bob@conduit.io",
        password: "sup3rsecret",
      }),
    ).rejects.toThrow(/Email already exists/);
  });

  it("rejects a duplicate username", async () => {
    await register({
      username: "carol",
      email: "carol@conduit.io",
      password: "sup3rsecret",
    });
    await expect(
      register({
        username: "carol",
        email: "carol2@conduit.io",
        password: "sup3rsecret",
      }),
    ).rejects.toThrow(/Username already exists/);
  });
});

describe("login", () => {
  it("succeeds with correct credentials and issues a token", async () => {
    await register({
      username: "dave",
      email: "dave@conduit.io",
      password: "sup3rsecret",
    });
    const { user, token } = await login({
      email: "dave@conduit.io",
      password: "sup3rsecret",
    });
    expect(user.email).toBe("dave@conduit.io");
    expect(verifySession(token).email).toBe("dave@conduit.io");
  });

  it("rejects a wrong password with a validation error", async () => {
    await register({
      username: "erin",
      email: "erin@conduit.io",
      password: "sup3rsecret",
    });
    await expect(
      login({ email: "erin@conduit.io", password: "wrongpass" }),
    ).rejects.toThrow(/Wrong email\/password/);
  });

  it("rejects an unknown email as not found", async () => {
    await expect(
      login({ email: "ghost@conduit.io", password: "whatever1" }),
    ).rejects.toThrow(/not found/);
  });
});
