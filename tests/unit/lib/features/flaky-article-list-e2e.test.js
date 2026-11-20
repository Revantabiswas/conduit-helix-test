import { describe, it, expect } from "vitest";
import { isPaginationStable } from "../../../../src/lib/features/flaky-article-list-e2e.js";

describe("pagination stability", () => {
  it("is false with too few samples", () => expect(isPaginationStable([10, 10])).toBe(false));
  it("is false while the count is changing", () => expect(isPaginationStable([5, 10, 10])).toBe(false));
  it("is true once settled", () => expect(isPaginationStable([5, 10, 10, 10])).toBe(true));
});
