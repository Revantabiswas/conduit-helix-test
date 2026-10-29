import { describe, it, expect } from "vitest";
import { batchFanout } from "../../../../src/lib/features/notification-fanout.js";

describe("fan-out batching", () => {
  it("splits into batches", () => {
    const r = Array.from({ length: 1200 }, (_, i) => i);
    expect(batchFanout(r, 500).map((b) => b.length)).toEqual([500, 500, 200]);
  });
  it("returns no batches for no recipients", () => expect(batchFanout([])).toEqual([]));
  it("rejects a bad batch size", () => expect(() => batchFanout([1], 0)).toThrow());
});
