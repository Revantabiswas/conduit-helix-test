import { describe, it, expect } from "vitest";
import { nextBadgeCount } from "../../../../src/lib/features/stale-notification-badge.js";

describe("badge count", () => {
  it("clears after mark-all-read (the reported bug)", () => expect(nextBadgeCount(7, "mark-all-read")).toBe(0));
  it("never goes negative", () => expect(nextBadgeCount(0, "mark-one-read")).toBe(0));
  it("counts new notifications", () => expect(nextBadgeCount(2, "new")).toBe(3));
});
