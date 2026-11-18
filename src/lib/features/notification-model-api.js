/** Notification listing: newest first, paginated, with an unread count. */
export function listNotifications(items, { page = 1, perPage = 20 } = {}) {
  const sorted = [...items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const start = (Math.max(1, page) - 1) * perPage;
  return {
    items: sorted.slice(start, start + perPage),
    total: sorted.length,
    unread: sorted.filter((n) => !n.read).length,
  };
}
