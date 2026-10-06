import { describe, it, expect } from "vitest";
import { tagIndex } from "../../../../src/lib/features/tag-index-api.js";

describe("tag index", () => {
  it("counts and sorts", () => {
    const idx = tagIndex([{ tagList: ["a", "b"] }, { tagList: ["b", "c"] }, { tagList: ["b"] }]);
    expect(idx[0]).toEqual({ tag: "b", count: 3 });
    expect(idx.map((t) => t.tag)).toEqual(["b", "a", "c"]);
  });
  it("counts a repeated tag once per article", () => {
    expect(tagIndex([{ tagList: ["x", "x"] }])).toEqual([{ tag: "x", count: 1 }]);
  });
});
