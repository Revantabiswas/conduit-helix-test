// Unit tests for the user & profiles services (Story 1.3, REQ-F-11, REQ-F-13).

import { describe, it, expect, beforeAll, beforeEach } from "vitest";

process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "sqlite::memory:";
process.env.DB_DIALECT = "sqlite";
process.env.JWT_SECRET = "profiles-test-secret";

const { sequelize, User } = await import("../../../../src/lib/db/index.js");
const { register } = await import("../../../../src/lib/services/users.js");
const userService = await import("../../../../src/lib/services/user.js");
const profiles = await import("../../../../src/lib/services/profiles.js");

async function makeUser(username) {
  await register({
    username,
    email: `${username}@conduit.io`,
    password: "sup3rsecret",
  });
  return User.findOne({ where: { username } });
}

beforeAll(async () => {
  await sequelize.sync({ force: true });
});
beforeEach(async () => {
  await User.destroy({ where: {}, truncate: true });
});

describe("user service", () => {
  it("getCurrent returns the user with a fresh token", async () => {
    const u = await makeUser("amy");
    const { user } = userService.getCurrent(u);
    expect(user.username).toBe("amy");
    expect(user.token).toBeTruthy();
    expect(user.password).toBeUndefined();
  });

  it("update writes allowed fields and re-hashes a new password", async () => {
    const u = await makeUser("ben");
    const { user } = await userService.update(u, {
      bio: "hello",
      image: "http://img/x.png",
      password: "newpassw0rd",
    });
    expect(user.bio).toBe("hello");
    expect(user.image).toBe("http://img/x.png");
    const reloaded = await User.findOne({ where: { username: "ben" } });
    expect(reloaded.password).not.toBe("newpassw0rd");
  });

  it("update ignores undefined fields", async () => {
    const u = await makeUser("cara");
    const { user } = await userService.update(u, { bio: undefined });
    expect(user.username).toBe("cara");
  });
});

describe("profiles service", () => {
  it("getProfile returns following=false for an anonymous viewer", async () => {
    await makeUser("dana");
    const { profile } = await profiles.getProfile("dana", null);
    expect(profile.username).toBe("dana");
    expect(profile.following).toBe(false);
    expect(profile.followersCount).toBe(0);
  });

  it("getProfile throws NotFoundError for an unknown username", async () => {
    await expect(profiles.getProfile("nobody", null)).rejects.toThrow(
      /not found/,
    );
  });

  it("toggleFollow follows and reflects following=true + count", async () => {
    const follower = await makeUser("dan");
    await makeUser("eve");
    const { profile } = await profiles.toggleFollow("eve", follower, true);
    expect(profile.following).toBe(true);
    expect(profile.followersCount).toBe(1);
  });

  it("toggleFollow unfollow reverses it", async () => {
    const follower = await makeUser("finn");
    await makeUser("gwen");
    await profiles.toggleFollow("gwen", follower, true);
    const { profile } = await profiles.toggleFollow("gwen", follower, false);
    expect(profile.following).toBe(false);
    expect(profile.followersCount).toBe(0);
  });

  it("follow is idempotent (following the same user twice is a no-op)", async () => {
    const follower = await makeUser("ida");
    await makeUser("jack");
    await profiles.toggleFollow("jack", follower, true);
    const { profile } = await profiles.toggleFollow("jack", follower, true);
    expect(profile.followersCount).toBe(1);
  });

  it("rejects self-follow with a validation error", async () => {
    const hana = await makeUser("hana");
    await expect(
      profiles.toggleFollow("hana", hana, true),
    ).rejects.toThrow(/Cannot follow yourself/);
  });
});
