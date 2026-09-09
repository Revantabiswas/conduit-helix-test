// User service — current user + profile update (Story 1.3, REQ-F-11).
// Ported from backend/controllers/user.js. Layering: Route Handlers call these; the
// handler resolves/authorizes the user (requireSessionUser) before invoking them.

import { signSession, hashPassword } from "../auth.js";

// Fields a user is allowed to update on themselves.
const UPDATABLE = ["email", "username", "bio", "image"];

/**
 * Return the authenticated user's own record, with a fresh token echoed
 * (matches the legacy currentUser response shape).
 * @param {import('sequelize').Model} user
 * @returns {{ user: object }}
 */
export function getCurrent(user) {
  return { user: { ...user.toJSON(), token: signSession(user) } };
}

/**
 * Update the authenticated user. Only defined, allowed fields are written; a non-empty
 * password is re-hashed. Ported from backend/controllers/user.js updateUser (fixing the
 * legacy bug where the password branch always ran).
 * @param {import('sequelize').Model} user
 * @param {object} changes
 * @returns {Promise<{ user: object }>}
 */
export async function update(user, changes = {}) {
  for (const key of UPDATABLE) {
    if (changes[key] !== undefined) user[key] = changes[key];
  }
  if (changes.password !== undefined && changes.password !== "") {
    user.password = await hashPassword(changes.password);
  }
  await user.save();
  return { user: { ...user.toJSON(), token: signSession(user) } };
}
