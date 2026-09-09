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

/**
 * Assemble the Conduit article response shape from an ALREADY eager-loaded article
 * (with its `tagList` and `author` includes) plus pre-batched lookup sets. This is the
 * N+1 fix (REQ-F-17 / ARCH-02): it performs NO database access — every per-article
 * follower/favorite/tag value comes from data the caller fetched in bounded, page-wide
 * queries, never a per-row await.
 *
 * @param {import('sequelize').Model} article  eager-loaded with tagList + author
 * @param {object} ctx
 * @param {Set<number>} ctx.favoritedIds   article ids the viewer has favorited
 * @param {Set<number>} ctx.followingIds   author ids the viewer follows
 * @param {Map<number, number>} ctx.favoritesCounts  articleId -> favorites count
 * @returns {object} the Conduit article shape
 */
export function articleToJSON(article, { favoritedIds, followingIds, favoritesCounts }) {
  const tagList = (article.tagList ?? []).map((t) => t.name).sort();
  const author = article.author;
  return {
    slug: article.slug,
    title: article.title,
    description: article.description,
    body: article.body,
    tagList,
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
    favorited: favoritedIds.has(article.id),
    favoritesCount: favoritesCounts.get(article.id) ?? 0,
    author: {
      username: author?.username ?? null,
      bio: author?.bio ?? null,
      image: author?.image ?? null,
      following: author ? followingIds.has(author.id) : false,
    },
  };
}
