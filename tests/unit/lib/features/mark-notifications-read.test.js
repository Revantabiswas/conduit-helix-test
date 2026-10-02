import { describe, it, expect } from "vitest";
import { markRead } from "../../../../src/lib/features/mark-notifications-read.js";

const base = [{ id: 1, read: false }, { id: 2, read: false }];

describe("markRead", () => {
  it("marks a single notification", () => {
    expect(markRead(base, 1).map((n) => n.read)).toEqual([true, false]);
  });
  it("marks all", () => {
    expect(markRead(base, "all").every((n) => n.read)).toBe(true);
  });
  it("leaves the input untouched", () => {
    markRead(base, "all");
    expect(base.every((n) => !n.read)).toBe(true);
  });
});
