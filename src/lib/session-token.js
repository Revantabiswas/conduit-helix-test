// Edge-safe session-token utilities (Story 1.2 / fixed in 1.9 for the Edge runtime).
//
// 🔴 This module MUST NOT import Sequelize or anything that touches the database — it is
// imported by src/middleware.js, which runs in the Next.js EDGE runtime where Node core
// APIs Sequelize relies on (util.deprecate, etc.) are unavailable. It holds only the
// cookie name, the JWT secret resolution, and sign/verify. The DB-touching auth helpers
// (getSessionUser / requireSessionUser) live in auth.js, which is Node-runtime only.

import jwt from "jsonwebtoken";

export const SESSION_COOKIE = "conduit_token";

function secret() {
  // Legacy backend used JWT_KEY; requirements/.env.local.example use JWT_SECRET. Accept both.
  return process.env.JWT_SECRET ?? process.env.JWT_KEY;
}

/**
 * Sign a session token for a user (username + email claims, matching the legacy payload).
 * @param {{ username: string, email: string }} user
 * @returns {string}
 */
export function signSession(user) {
  return jwt.sign({ username: user.username, email: user.email }, secret());
}

/**
 * Verify a session token and return its decoded claims, or null if invalid/absent.
 * @param {string|undefined|null} token
 * @returns {{ username: string, email: string } | null}
 */
export function verifySession(token) {
  if (!token) return null;
  try {
    return jwt.verify(token, secret());
  } catch {
    return null;
  }
}
