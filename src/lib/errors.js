// Typed error hierarchy for the Next.js app (Story 1.2, REQ-F-16).
// Ported verbatim in logic from backend/helper/customErrors.js, plus a status/response
// mapping (ported from backend/middleware/errorHandler.js) so Route Handlers can turn any
// domain error into the Conduit spec's { errors: { body: [...] } } shape (ARCH-04).

export class MyError extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class ForbiddenError extends MyError {
  constructor(message) {
    super(`You are not the author of this ${message}`);
  }
}

export class NotFoundError extends MyError {
  constructor(property, message = "") {
    super(`${property} not found ${message}`);
  }
}

export class UnauthorizedError extends MyError {
  constructor() {
    super("You need to login first!");
  }
}

export class ValidationError extends MyError {}

export class FieldRequiredError extends ValidationError {
  constructor(field) {
    super(`${field} is required`);
  }
}

export class AlreadyTakenError extends ValidationError {
  constructor(property, message = "") {
    super(`${property} already exists.. ${message}`);
  }
}

/**
 * Map a domain error to its Conduit HTTP status code.
 * Mirrors backend/middleware/errorHandler.js (401/403/404/422/500).
 * @param {Error} error
 * @returns {number}
 */
export function statusFor(error) {
  if (error instanceof UnauthorizedError) return 401;
  if (error instanceof ForbiddenError) return 403;
  if (error instanceof NotFoundError) return 404;
  if (error instanceof ValidationError) return 422;
  return 500;
}

/**
 * Build the Conduit error response body for a domain error.
 * @param {Error} error
 * @returns {{ errors: { body: string[] } }}
 */
export function toErrorResponse(error) {
  return { errors: { body: [error.message] } };
}
