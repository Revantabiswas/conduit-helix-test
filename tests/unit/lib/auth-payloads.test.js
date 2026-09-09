// Unit tests for the auth payload builders + client-api error normalisation (Story 1.6).

import { describe, it, expect } from "vitest";
import {
  buildLoginPayload,
  buildRegisterPayload,
  buildSettingsPayload,
} from "../../../src/lib/auth-payloads.js";
import { normaliseErrors } from "../../../src/lib/client-api.js";

describe("payload builders", () => {
  it("buildLoginPayload wraps email+password in the Conduit shape", () => {
    expect(
      buildLoginPayload({ email: "a@b.io", password: "pw" }),
    ).toEqual({ user: { email: "a@b.io", password: "pw" } });
  });

  it("buildRegisterPayload wraps username+email+password", () => {
    expect(
      buildRegisterPayload({
        username: "amy",
        email: "a@b.io",
        password: "pw",
      }),
    ).toEqual({ user: { username: "amy", email: "a@b.io", password: "pw" } });
  });

  it("buildSettingsPayload omits blank fields and a blank password", () => {
    const payload = buildSettingsPayload({
      bio: "hi",
      image: "http://x/y.png",
      email: "",
      password: "",
    });
    expect(payload.user.bio).toBe("hi");
    expect(payload.user.image).toBe("http://x/y.png");
    expect(payload.user.email).toBeUndefined();
    expect(payload.user.password).toBeUndefined();
  });

  it("buildSettingsPayload includes a non-blank password", () => {
    const payload = buildSettingsPayload({ password: "newpassw0rd" });
    expect(payload.user.password).toBe("newpassw0rd");
  });
});

describe("normaliseErrors", () => {
  it("flattens the Conduit error envelope", () => {
    expect(
      normaliseErrors({ errors: { body: ["Email already exists", "Username taken"] } }),
    ).toEqual(["Email already exists", "Username taken"]);
  });

  it("returns [] when there is no error body", () => {
    expect(normaliseErrors({})).toEqual([]);
    expect(normaliseErrors(null)).toEqual([]);
    expect(normaliseErrors({ errors: {} })).toEqual([]);
  });
});
