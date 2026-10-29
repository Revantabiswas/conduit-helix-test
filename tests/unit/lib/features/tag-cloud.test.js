import { describe, it, expect } from "vitest";
import { tagFontSize } from "../../../../src/lib/features/tag-cloud.js";

describe("tag font size", () => {
  it("is the minimum for the rarest tag", () => expect(tagFontSize(1)).toBe(12));
  it("is the maximum for the most common tag", () => expect(tagFontSize(50)).toBe(28));
  it("clamps out-of-range counts", () => {
    expect(tagFontSize(500)).toBe(28);
    expect(tagFontSize(-5)).toBe(12);
  });
});
