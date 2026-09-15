import { describe, it, expect } from "vitest";
import { toggleFollow, isFollowing } from "../../../../src/lib/features/follow-authors.js";

describe("follow authors", () => {
  it("follows then unfollows", () => {
    let s = toggleFollow(new Map(), "amy", "bob");
    expect(isFollowing(s, "amy", "bob")).toBe(true);
    s = toggleFollow(s, "amy", "bob");
    expect(isFollowing(s, "amy", "bob")).toBe(false);
  });
  it("rejects following yourself", () => {
    expect(() => toggleFollow(new Map(), "amy", "amy")).toThrow();
  });
  it("does not mutate the input map", () => {
    const original = new Map();
    toggleFollow(original, "amy", "bob");
    expect(original.size).toBe(0);
  });
});
