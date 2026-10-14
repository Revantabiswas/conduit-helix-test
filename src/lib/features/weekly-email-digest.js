/** Group unread activity from followed authors per user; users with nothing new are skipped. */
export function buildDigests(activity, followsByUser) {
  const digests = [];
  for (const [user, authors] of Object.entries(followsByUser)) {
    const items = activity.filter((a) => authors.includes(a.author) && !a.seenBy?.includes(user));
    if (items.length) digests.push({ user, items });
  }
  return digests;
}
