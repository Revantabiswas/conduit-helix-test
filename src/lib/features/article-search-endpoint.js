/** Rank articles for a query: title hits outrank description hits outrank body hits. */
export function searchArticles(articles, q) {
  const query = String(q || "").trim().toLowerCase();
  if (!query) throw new Error("Query must not be empty");
  const score = (a) =>
    (a.title?.toLowerCase().includes(query) ? 3 : 0) +
    (a.description?.toLowerCase().includes(query) ? 2 : 0) +
    (a.body?.toLowerCase().includes(query) ? 1 : 0);
  return articles
    .map((a) => ({ a, s: score(a) }))
    .filter((x) => x.s > 0)
    .sort((x, y) => y.s - x.s)
    .map((x) => x.a);
}
