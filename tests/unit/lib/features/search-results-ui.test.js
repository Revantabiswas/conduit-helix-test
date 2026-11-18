import { describe, it, expect } from "vitest";
import { highlight } from "../../../../src/lib/features/search-results-ui.js";

describe("highlight", () => {
  it("marks matches", () => {
    expect(highlight("Cats and cats", "cats").filter((s) => s.match)).toHaveLength(2);
  });
  it("returns the text unmarked for an empty query", () => {
    expect(highlight("hello", "")).toEqual([{ text: "hello", match: false }]);
  });
  it("escapes regex characters", () => {
    expect(highlight("a.b", ".")[1]).toEqual({ text: ".", match: true });
  });
});
