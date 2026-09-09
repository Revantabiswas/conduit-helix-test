// Server-side session helper (Story 1.6, REQ-F-28) — replaces the client AuthContext.
// The session lives ONLY in the httpOnly cookie (ARCH-03 / REQ-NF-01); this module reads
// it server-side via next/headers and resolves the user. No localStorage anywhere.

import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession, clearSessionCookie } from "./auth.js";
import { User } from "./db/index.js";

/**
 * Resolve the current user from the request's session cookie, server-side.
 * @returns {Promise<import('sequelize').Model | null>}
 */
export async function getServerSession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const claims = verifySession(token);
  if (!claims) return null;
  return User.findOne({ where: { email: claims.email } });
}

/**
 * Log the current user out by clearing the session cookie.
 * Intended to run as a Server Action.
 * @returns {Promise<void>}
 */
export async function logout() {
  const store = await cookies();
  const cleared = clearSessionCookie();
  store.set(cleared.name, cleared.value, {
    httpOnly: cleared.httpOnly,
    sameSite: cleared.sameSite,
    secure: cleared.secure,
    path: cleared.path,
    maxAge: cleared.maxAge,
  });
}
