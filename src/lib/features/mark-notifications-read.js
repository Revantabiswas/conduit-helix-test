/** Mark one, several or all notifications read without mutating the input. */
export function markRead(notifications, target) {
  const all = target === "all";
  const ids = new Set(Array.isArray(target) ? target : [target]);
  return notifications.map((n) => (all || ids.has(n.id) ? { ...n, read: true } : n));
}
