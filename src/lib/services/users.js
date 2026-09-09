// Users service — register & login business logic (Story 1.2, REQ-F-10).
// Ported from backend/controllers/users.js, with the tightened validation rules from
// spec/plans/functional-design.md (email format, password >= 8, username 3-30 + unique).
//
// Layering (ARCH-01): Route Handlers call these functions; the Route Handlers never touch
// the Sequelize models directly. This module is the only place users-domain logic lives.

import { User } from "../db/index.js";
import {
  FieldRequiredError,
  ValidationError,
  AlreadyTakenError,
  NotFoundError,
} from "../errors.js";
import { signSession, hashPassword, comparePassword } from "../auth.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[A-Za-z0-9_-]{3,30}$/;
const MIN_PASSWORD = 8;

/**
 * Validate & apply the tightened registration rules.
 * @param {{ username?: string, email?: string, password?: string }} input
 */
function validateRegistration({ username, email, password }) {
  if (!username) throw new FieldRequiredError("A username");
  if (!email) throw new FieldRequiredError("An email");
  if (!password) throw new FieldRequiredError("A password");

  if (!USERNAME_RE.test(username)) {
    throw new ValidationError(
      "Username must be 3-30 characters (letters, numbers, _, -)",
    );
  }
  if (!EMAIL_RE.test(email)) {
    throw new ValidationError("A valid email address is required");
  }
  if (password.length < MIN_PASSWORD) {
    throw new ValidationError(
      `Password must be at least ${MIN_PASSWORD} characters`,
    );
  }
}

/**
 * Register a new user.
 * @param {{ username: string, email: string, password: string, bio?: string, image?: string }} input
 * @returns {Promise<{ user: object, token: string }>}
 */
export async function register(input) {
  validateRegistration(input);
  const { username, email, password, bio, image } = input;

  if (await User.findOne({ where: { email } })) {
    throw new AlreadyTakenError("Email", "try logging in");
  }
  if (await User.findOne({ where: { username } })) {
    throw new AlreadyTakenError("Username", "choose another");
  }

  const created = await User.create({
    email,
    username,
    bio,
    image,
    password: await hashPassword(password),
  });

  const token = signSession(created);
  return { user: withToken(created, token), token };
}

/**
 * Log a user in with email + password.
 * @param {{ email?: string, password?: string }} input
 * @returns {Promise<{ user: object, token: string }>}
 */
export async function login({ email, password } = {}) {
  const existing = await User.findOne({ where: { email } });
  if (!existing) throw new NotFoundError("Email", "sign in first");

  const ok = await comparePassword(password ?? "", existing.password);
  if (!ok) throw new ValidationError("Wrong email/password combination");

  const token = signSession(existing);
  return { user: withToken(existing, token), token };
}

/**
 * Serialise a user for the Conduit API response, attaching the token to the redacted
 * public shape (the model's toJSON already strips id/password/timestamps).
 * @param {import('sequelize').Model} user
 * @param {string} token
 * @returns {object}
 */
function withToken(user, token) {
  return { ...user.toJSON(), token };
}
