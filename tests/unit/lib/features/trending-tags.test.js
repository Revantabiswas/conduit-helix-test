import { describe, it, expect } from "vitest";
import { trendingTags } from "../../../../src/lib/features/trending-tags.js";

const now = new Date("2026-11-18T00:00:00Z").getTime();
const at = (d) => new Date(now - d * 86400000).toISOString();

describe("trending tags", () => {
  it("prefers recent activity", () => {
    const ev = [{ tag: "old", at: at(6) }, { tag: "old", at: at(6) }, { tag: "new", at: at(0) }, { tag: "new", at: at(1) }, { tag: "new", at: at(1) }];
    expect(trendingTags(ev, now)[0]).toBe("new");
  });
  it("falls back to all-time when the window is sparse", () => {
    expect(trendingTags([{ tag: "x", at: at(30) }], now)).toEqual(["x"]);
  });
});
