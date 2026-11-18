import { describe, it, expect } from "vitest";
import { badgeLabel } from "../../../../src/lib/features/notification-bell.js";

describe("badge label", () => {
  it("is empty at zero", () => expect(badgeLabel(0)).toBe(""));
  it("shows the count", () => expect(badgeLabel(4)).toBe("4"));
  it("caps at 9+", () => {
    expect(badgeLabel(9)).toBe("9");
    expect(badgeLabel(10)).toBe("9+");
  });
});
