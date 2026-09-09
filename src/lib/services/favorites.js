// Favorites service — favorite/unfavorite an article (Story 1.5, REQ-F-12).
// Ported from backend/controllers/favorites.js. Idempotent. The enriched article shape
// (favorited/favoritesCount) is produced by the articles service's own N+1-free path
// (ARCH-02), so favorites stays consistent with Story 1.4.

import { Article } from "../db/index.js";
import { NotFoundError } from "../errors.js";
import { get } from "./articles.js";

/**
 * Favorite (favorite=true) or unfavorite (false) an article for the viewer. Idempotent.
 * @param {string} slug
 * @param {import('sequelize').Model} viewer
 * @param {boolean} favorite
 * @returns {Promise<{ article: object }>}
 */
export async function toggle(slug, viewer, favorite) {
  const article = await Article.findOne({ where: { slug } });
  if (!article) throw new NotFoundError("Article");

  if (favorite) {
    await article.addUser(viewer);
  } else {
    await article.removeUser(viewer);
  }

  return get(slug, viewer);
}
