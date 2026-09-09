// Shared helpers for the Next.js app (Story 1.2 creates this module — a dependency-graph
// shared file). Ported from backend/helper/helpers.js.
//
// NOTE: only slugify is ported here. The response-enrichment helpers
// (appendFollowers/appendFavorites/appendTagList) are intentionally NOT ported as the
// per-row loop the legacy code used — Story 1.4 replaces them with a single eager-loaded
// Sequelize include query (ARCH-02, REQ-F-17). Porting the N+1 loop now would contradict
// that architecture constraint.

/**
 * Convert an article title into a URL slug.
 * Ported verbatim from backend/helper/helpers.js.
 * @param {string} string
 * @returns {string}
 */
export function slugify(string) {
  return string.trim().toLowerCase().replace(/\W|_/g, "-");
}
