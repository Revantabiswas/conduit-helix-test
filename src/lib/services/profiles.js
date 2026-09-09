// Profiles service — public profile + follow/unfollow (Story 1.3, REQ-F-13).
// Ported from backend/controllers/profiles.js.
//
// 🔴 following / followersCount are computed with a single count()/has() query pair
// (ARCH-02) — NOT the legacy appendFollowers per-row loop, which Story 1.4 removes
// entirely. Self-follow is rejected (functional-design.md tightened rule).

import { User } from "../db/index.js";
import { NotFoundError, ValidationError } from "../errors.js";

/**
 * Resolve a user by username or throw NotFoundError.
 * @param {string} username
 * @returns {Promise<import('sequelize').Model>}
 */
async function findProfileUser(username) {
  const profile = await User.findOne({ where: { username } });
  if (!profile) throw new NotFoundError("User profile");
  return profile;
}

/**
 * Build the Conduit profile shape for a target user as seen by an optional viewer.
 * @param {import('sequelize').Model} profileUser
 * @param {import('sequelize').Model|null} viewer
 * @returns {Promise<object>}
 */
async function toProfile(profileUser, viewer) {
  const following = viewer
    ? await profileUser.hasFollower(viewer)
    : false;
  const followersCount = await profileUser.countFollowers();
  return {
    username: profileUser.username,
    bio: profileUser.bio ?? null,
    image: profileUser.image ?? null,
    following,
    followersCount,
  };
}

/**
 * Get a public profile.
 * @param {string} username
 * @param {import('sequelize').Model|null} viewer
 * @returns {Promise<{ profile: object }>}
 */
export async function getProfile(username, viewer = null) {
  const profileUser = await findProfileUser(username);
  return { profile: await toProfile(profileUser, viewer) };
}

/**
 * Follow or unfollow a user. Idempotent. Rejects self-follow.
 * @param {string} username target
 * @param {import('sequelize').Model} viewer the authenticated follower
 * @param {boolean} follow true=follow, false=unfollow
 * @returns {Promise<{ profile: object }>}
 */
export async function toggleFollow(username, viewer, follow) {
  const profileUser = await findProfileUser(username);
  if (profileUser.id === viewer.id) {
    throw new ValidationError("Cannot follow yourself");
  }
  if (follow) {
    await profileUser.addFollower(viewer);
  } else {
    await profileUser.removeFollower(viewer);
  }
  return { profile: await toProfile(profileUser, viewer) };
}
