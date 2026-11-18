/** Tag index: tag + article count, sorted by count then name. */
export function tagIndex(articles) {
  const counts = new Map();
  for (const a of articles) for (const t of new Set(a.tagList || [])) counts.set(t, (counts.get(t) || 0) + 1);
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((x, y) => y.count - x.count || x.tag.localeCompare(y.tag));
}
