/** Next badge count after a notification action, so the bell updates without a reload. */
export function nextBadgeCount(current, action) {
  if (action === "mark-all-read") return 0;
  if (action === "mark-one-read") return Math.max(0, current - 1);
  if (action === "new") return current + 1;
  return current;
}
