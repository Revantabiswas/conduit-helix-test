/** Rank tags by recent activity with exponential decay; falls back to all-time when sparse. */
export function trendingTags(events, now = Date.now(), { windowDays = 7, minEvents = 3, limit = 10 } = {}) {
  const day = 86400000;
  const recent = events.filter((e) => now - new Date(e.at).getTime() <= windowDays * day);
  const pool = recent.length >= minEvents ? recent : events;
  const scores = new Map();
  for (const e of pool) {
    const ageDays = Math.max(0, (now - new Date(e.at).getTime()) / day);
    scores.set(e.tag, (scores.get(e.tag) || 0) + Math.pow(0.5, ageDays / 2));
  }
  return [...scores.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit).map(([tag]) => tag);
}
