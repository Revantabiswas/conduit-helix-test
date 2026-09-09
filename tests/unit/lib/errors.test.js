// Unit tests for the ported error hierarchy + status/response mapping (Story 1.2, REQ-F-16).

import { describe, it, expect } from "vitest";
import {
  MyError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
  FieldRequiredError,
  AlreadyTakenError,
  statusFor,
  toErrorResponse,
} from "../../../src/lib/errors.js";

describe("error hierarchy", () => {
  it("sets the constructor name", () => {
    expect(new NotFoundError("User").name).toBe("NotFoundError");
    expect(new ForbiddenError("article").name).toBe("ForbiddenError");
  });

  it("FieldRequiredError and AlreadyTakenError are ValidationErrors", () => {
    expect(new FieldRequiredError("email")).toBeInstanceOf(ValidationError);
    expect(new AlreadyTakenError("Email")).toBeInstanceOf(ValidationError);
    expect(new ValidationError("x")).toBeInstanceOf(MyError);
  });

  it("composes messages like the legacy backend", () => {
    expect(new ForbiddenError("comment").message).toBe(
      "You are not the author of this comment",
    );
    expect(new NotFoundError("Email", "sign in first").message).toBe(
      "Email not found sign in first",
    );
    expect(new UnauthorizedError().message).toBe("You need to login first!");
  });
});

describe("statusFor", () => {
  it("maps each error to its Conduit HTTP status", () => {
    expect(statusFor(new UnauthorizedError())).toBe(401);
    expect(statusFor(new ForbiddenError("x"))).toBe(403);
    expect(statusFor(new NotFoundError("x"))).toBe(404);
    expect(statusFor(new ValidationError("x"))).toBe(422);
    expect(statusFor(new FieldRequiredError("x"))).toBe(422);
    expect(statusFor(new Error("boom"))).toBe(500);
  });
});

describe("toErrorResponse", () => {
  it("wraps the message in the Conduit error envelope", () => {
    expect(toErrorResponse(new ValidationError("bad"))).toEqual({
      errors: { body: ["bad"] },
    });
  });
});
