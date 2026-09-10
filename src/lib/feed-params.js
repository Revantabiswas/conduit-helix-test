// Feed-selection resolver (Story 1.7, REQ-F-29). Replaces the client FeedContext:
// the home feed's mode/filter is derived from the URL search params, server-side.
// Pure and unit-testable.

const PAGE_SIZE = 10;

/**
 * Resolve the feed mode and the articles-service query from URL search params.
 * @param {Record<string,string>|URLSearchParams} searchParams  ?feed=personal | ?tag=react | ?page=2
 * @param {boolean} viewerPresent  whether a signed-in viewer exists
 * @returns {{ mode: 'global'|'personal'|'tag', tag: string|null, page: number, listQuery: object }}
 */
export function resolveFeed(searchParams, viewerPresent) {
  const get = (k) =>
    searchParams instanceof URLSearchParams
      ? searchParams.get(k)
      : (searchParams?.[k] ?? null);

  const feed = get("feed");
  const tag = get("tag");
  const page = Math.max(1, parseInt(get("page") ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  let mode = "global";
  if (tag) {
    mode = "tag";
  } else if (feed === "personal" && viewerPresent) {
    mode = "personal";
  }

  const listQuery = { limit: PAGE_SIZE, offset };
  if (mode === "tag") listQuery.tag = tag;

  return { mode, tag: mode === "tag" ? tag : null, page, listQuery };
}

export { PAGE_SIZE };
