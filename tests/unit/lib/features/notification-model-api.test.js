import { describe, it, expect } from "vitest";
import { listNotifications } from "../../../../src/lib/features/notification-model-api.js";

const items = [
  { id: 1, createdAt: "2026-09-01", read: true },
  { id: 2, createdAt: "2026-09-03", read: false },
  { id: 3, createdAt: "2026-09-02", read: false },
];

describe("notification list", () => {
  it("orders newest first and counts unread", () => {
    const r = listNotifications(items);
    expect(r.items.map((n) => n.id)).toEqual([2, 3, 1]);
    expect(r.unread).toBe(2);
    expect(r.total).toBe(3);
  });
  it("paginates", () => {
    expect(listNotifications(items, { page: 2, perPage: 2 }).items.map((n) => n.id)).toEqual([1]);
  });
});
