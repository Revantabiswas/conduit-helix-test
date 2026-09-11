// Auth library for the Next.js app (Story 1.2, REQ-F-15, REQ-NF-01).
// Replaces backend/middleware/authentication.js + backend/helper/{jwt,bcrypt}.js.
//
// Session model: a JWT is carried in an httpOnly cookie (NOT localStorage — ARCH-03 /
// REQ-NF-01). Route Handlers set/clear the cookie; getSessionUser reads it and resolves
// the User (soft auth: returns null when absent), requireSessionUser throws when absent.

import bcrypt from "bcryptjs";
import { UnauthorizedError } from "./errors.js";
import { User } from "./db/index.js";
import {
  SESSION_COOKIE,
  signSession,
  verifySession,
} from "./session-token.js";

// Re-export the Edge-safe token utilities so existing importers of auth.js keep working.
// (The token logic itself lives in session-token.js, which the Edge middleware imports
// WITHOUT pulling in Sequelize — see that file's header.)
export { SESSION_COOKIE, signSession, verifySession };

/**
 * Build the Set-Cookie attributes for the session cookie (httpOnly, sameSite=lax,
 * secure in production). Returned as an options object for NextResponse.cookies.set.
 * @param {string} token
 * @returns {{ name: string, value: string } & import('next/dist/compiled/@edge-runtime/cookies').CookieSerializeOptions}
 */
export function sessionCookie(token) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

/**
 * Clear the session cookie (logout).
 * @returns {{ name: string, value: string } & object}
 */
export function clearSessionCookie() {
  return {
    name: SESSION_COOKIE,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };
}

/**
 * Read the session cookie from a request and resolve the current User.
 * Soft auth: returns null (no throw) when there is no valid session — public endpoints
 * pass through exactly like the legacy verifyToken middleware.
 * @param {Request} request
 * @returns {Promise<import('sequelize').Model | null>}
 */
export async function getSessionUser(request) {
  const token = readCookie(request, SESSION_COOKIE);
  const claims = verifySession(token);
  if (!claims) return null;
  return User.findOne({ where: { email: claims.email } });
}

/**
 * Resolve the current User or throw UnauthorizedError — for protected endpoints.
 * @param {Request} request
 * @returns {Promise<import('sequelize').Model>}
 */
export async function requireSessionUser(request) {
  const user = await getSessionUser(request);
  if (!user) throw new UnauthorizedError();
  return user;
}

/**
 * Hash a plaintext password (bcrypt, cost 10 — same as the legacy backend).
 * @param {string} password
 * @returns {Promise<string>}
 */
export function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

/**
 * Compare a plaintext password against a bcrypt hash.
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
export function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Read a cookie value from a Request's Cookie header without depending on the Next.js
 * runtime, so this module is unit-testable with a plain Request.
 * @param {Request} request
 * @param {string} name
 * @returns {string|undefined}
 */
export function readCookie(request, name) {
  const header = request.headers?.get?.("cookie");
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return undefined;
}
