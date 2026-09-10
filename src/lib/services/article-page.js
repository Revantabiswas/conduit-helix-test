// Article-page data assembler (Story 1.7, REQ-F-21). Composes the existing articles.get
// (1.4) and comments.list (1.5) services. NotFoundError from articles.get propagates.

import { get } from "./articles.js";
import { list as listComments } from "./comments.js";

/**
 * Assemble a single article page: the article plus its comments.
 * @param {string} slug
 * @param {import('sequelize').Model|null} viewer
 * @returns {Promise<{ article: object, comments: object[] }>}
 */
export async function getArticlePage(slug, viewer = null) {
  const { article } = await get(slug, viewer);
  const { comments } = await listComments(slug);
  return { article, comments };
}
