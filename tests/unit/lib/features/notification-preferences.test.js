import { describe, it, expect } from "vitest";
import { defaultPrefs, shouldNotify } from "../../../../src/lib/features/notification-preferences.js";

describe("preferences", () => {
  it("defaults to on", () => expect(shouldNotify(defaultPrefs(), "comment", "email")).toBe(true));
  it("respects an opt-out", () => {
    const p = defaultPrefs();
    p.comment.email = false;
    expect(shouldNotify(p, "comment", "email")).toBe(false);
    expect(shouldNotify(p, "comment", "app")).toBe(true);
  });
  it("treats unknown types as on", () => expect(shouldNotify({}, "other", "app")).toBe(true));
});
