// Comments service — list / create / delete comments (Story 1.5, REQ-F-12).
// Ported from backend/controllers/comments.js. Comment listing eager-loads the author in
// a single query (ARCH-02 — no per-row loop). Delete is author-only (functional-design.md).

import { Article, Comment, User } from "../db/index.js";
import {
  NotFoundError,
  FieldRequiredError,
  ForbiddenError,
} from "../errors.js";

/**
 * Shape a comment for the Conduit response.
 * @param {import('sequelize').Model} comment eager-loaded with `author`
 * @returns {object}
 */
function toComment(comment) {
  const author = comment.author;
  return {
    id: comment.id,
    body: comment.body,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    author: author
      ? {
          username: author.username,
          bio: author.bio ?? null,
          image: author.image ?? null,
        }
      : null,
  };
}

async function findArticle(slug) {
  const article = await Article.findOne({ where: { slug } });
  if (!article) throw new NotFoundError("Article");
  return article;
}

/**
 * List all comments for an article, newest first, authors eager-loaded (one query).
 * @param {string} slug
 * @returns {Promise<{ comments: object[] }>}
 */
export async function list(slug) {
  const article = await findArticle(slug);
  const comments = await article.getComments({
    include: [
      { model: User, as: "author", attributes: { exclude: ["email", "password"] } },
    ],
    order: [["createdAt", "DESC"]],
  });
  return { comments: comments.map(toComment) };
}

/**
 * Add a comment to an article.
 * @param {string} slug
 * @param {import('sequelize').Model} viewer
 * @param {string} body
 * @returns {Promise<{ comment: object }>}
 */
export async function create(slug, viewer, body) {
  if (!body) throw new FieldRequiredError("Comment body");
  const article = await findArticle(slug);
  const comment = await Comment.create({
    body,
    articleId: article.id,
    userId: viewer.id,
  });
  comment.author = viewer;
  return { comment: toComment(comment) };
}

/**
 * Delete a comment (author only).
 * @param {string} slug
 * @param {number|string} commentId
 * @param {import('sequelize').Model} viewer
 * @returns {Promise<{ message: { body: string[] } }>}
 */
export async function del(slug, commentId, viewer) {
  const comment = await Comment.findByPk(commentId);
  if (!comment) throw new NotFoundError("Comment");
  if (comment.userId !== viewer.id) throw new ForbiddenError("comment");
  await comment.destroy();
  return { message: { body: ["Comment deleted successfully"] } };
}
