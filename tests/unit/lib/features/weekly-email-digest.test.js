import { describe, it, expect } from "vitest";
import { buildDigests } from "../../../../src/lib/features/weekly-email-digest.js";

const activity = [
  { id: 1, author: "bob" },
  { id: 2, author: "cy", seenBy: ["amy"] },
];

describe("digests", () => {
  it("groups per user and skips empty digests", () => {
    const d = buildDigests(activity, { amy: ["bob", "cy"], dee: ["zed"] });
    expect(d).toHaveLength(1);
    expect(d[0].user).toBe("amy");
    expect(d[0].items.map((i) => i.id)).toEqual([1]);
  });
});
