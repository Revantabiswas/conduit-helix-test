// Articles service — CRUD, list, feed (Story 1.4, REQ-F-12, REQ-F-17).
// Ported from backend/controllers/articles.js, with the N+1 enrichment loop replaced by
// eager loading + page-wide batched lookups (ARCH-02 / REQ-NF-02).

import { Sequelize } from "sequelize";
import { sequelize, Article, Tag, User } from "../db/index.js";
import {
  FieldRequiredError,
  AlreadyTakenError,
  NotFoundError,
  ForbiddenError,
} from "../errors.js";
import { slugify, articleToJSON } from "../helpers.js";

const includeOptions = [
  { model: Tag, as: "tagList", attributes: ["name"] },
  { model: User, as: "author", attributes: { exclude: ["email", "password"] } },
];

/**
 * Build the per-page enrichment context in a BOUNDED number of queries, independent of
 * how many articles are on the page (the N+1 fix). For a viewer:
 *  - one query for the article ids they have favorited,
 *  - one grouped query for each article's total favorites count,
 *  - one query for the author ids they follow.
 * @param {import('sequelize').Model|null} viewer
 * @param {number[]} articleIds
 * @returns {Promise<{favoritedIds:Set<number>, followingIds:Set<number>, favoritesCounts:Map<number,number>}>}
 */
async function buildEnrichmentContext(viewer, articleIds) {
  const favoritedIds = new Set();
  const followingIds = new Set();
  const favoritesCounts = new Map();

  if (articleIds.length > 0) {
    // One grouped query: favorites count per article across the whole page.
    const counts = await Article.findAll({
      attributes: [
        "id",
        [Sequelize.fn("COUNT", Sequelize.col("Users.id")), "cnt"],
      ],
      include: [{ model: User, attributes: [], through: { attributes: [] } }],
      where: { id: articleIds },
      group: ["Article.id"],
      raw: true,
    });
    for (const row of counts) {
      favoritesCounts.set(row.id, Number(row.cnt));
    }
  }

  if (viewer) {
    const favs = await viewer.getFavorites({ attributes: ["id"] });
    for (const a of favs) favoritedIds.add(a.id);
    const following = await viewer.getFollowing({ attributes: ["id"] });
    for (const u of following) followingIds.add(u.id);
  }

  return { favoritedIds, followingIds, favoritesCounts };
}

/**
 * Enrich a page of eager-loaded articles into Conduit shape (no per-row DB access).
 * @param {import('sequelize').Model[]} rows
 * @param {import('sequelize').Model|null} viewer
 * @returns {Promise<object[]>}
 */
async function enrichPage(rows, viewer) {
  const ctx = await buildEnrichmentContext(
    viewer,
    rows.map((a) => a.id),
  );
  return rows.map((a) => articleToJSON(a, ctx));
}

/**
 * List articles with optional author/tag/favorited filters + pagination.
 * @param {{author?:string, tag?:string, favorited?:string, limit?:number, offset?:number}} query
 * @param {import('sequelize').Model|null} viewer
 * @returns {Promise<{articles:object[], articlesCount:number}>}
 */
export async function list(query = {}, viewer = null) {
  const { author, tag, favorited } = query;
  const limit = parseInt(query.limit ?? 20, 10);
  const offset = parseInt(query.offset ?? 0, 10);

  const searchOptions = {
    include: [
      {
        model: Tag,
        as: "tagList",
        attributes: ["name"],
        ...(tag && { where: { name: tag } }),
      },
      {
        model: User,
        as: "author",
        attributes: { exclude: ["email", "password"] },
        ...(author && { where: { username: author } }),
      },
    ],
    limit,
    offset,
    order: [["createdAt", "DESC"]],
    distinct: true,
  };

  let rows;
  let count;
  if (favorited) {
    const user = await User.findOne({ where: { username: favorited } });
    if (!user) return { articles: [], articlesCount: 0 };
    rows = await user.getFavorites(searchOptions);
    count = await user.countFavorites();
  } else {
    const result = await Article.findAndCountAll(searchOptions);
    rows = result.rows;
    count = result.count;
  }

  return { articles: await enrichPage(rows, viewer), articlesCount: count };
}

/**
 * The viewer's personal feed: articles by authors they follow.
 * @param {import('sequelize').Model} viewer
 * @param {{limit?:number, offset?:number}} query
 * @returns {Promise<{articles:object[], articlesCount:number}>}
 */
export async function feed(viewer, query = {}) {
  const limit = parseInt(query.limit ?? 20, 10);
  const offset = parseInt(query.offset ?? 0, 10);
  const authors = await viewer.getFollowing({ attributes: ["id"] });

  const result = await Article.findAndCountAll({
    include: includeOptions,
    limit,
    offset,
    order: [["createdAt", "DESC"]],
    where: { userId: authors.map((a) => a.id) },
    distinct: true,
  });

  return {
    articles: await enrichPage(result.rows, viewer),
    articlesCount: result.count,
  };
}

/**
 * Create an article for the author.
 * @param {import('sequelize').Model} author
 * @param {{title?:string, description?:string, body?:string, tagList?:string[]}} input
 * @returns {Promise<{article:object}>}
 */
export async function create(author, input = {}) {
  const { title, description, body, tagList = [] } = input;
  if (!title) throw new FieldRequiredError("A title");
  if (!description) throw new FieldRequiredError("A description");
  if (!body) throw new FieldRequiredError("An article body");

  const slug = slugify(title);
  if (await Article.findOne({ where: { slug } })) {
    throw new AlreadyTakenError("Title");
  }

  const article = await Article.create({ slug, title, description, body });
  await article.setAuthor(author);
  await associateTags(article, tagList);

  return { article: await getEnriched(slug, author) };
}

/**
 * Get a single article by slug.
 * @param {string} slug
 * @param {import('sequelize').Model|null} viewer
 * @returns {Promise<{article:object}>}
 */
export async function get(slug, viewer = null) {
  return { article: await getEnriched(slug, viewer) };
}

/**
 * Update an article (author only). Re-slugs on a title change.
 * @param {string} slug
 * @param {import('sequelize').Model} viewer
 * @param {{title?:string, description?:string, body?:string}} changes
 * @returns {Promise<{article:object}>}
 */
export async function update(slug, viewer, changes = {}) {
  const article = await findOrThrow(slug);
  await assertAuthor(article, viewer);

  let newSlug = slug;
  if (changes.title) {
    newSlug = slugify(changes.title);
    article.slug = newSlug;
    article.title = changes.title;
  }
  if (changes.description) article.description = changes.description;
  if (changes.body) article.body = changes.body;
  await article.save();

  return { article: await getEnriched(newSlug, viewer) };
}

/**
 * Delete an article (author only).
 * @param {string} slug
 * @param {import('sequelize').Model} viewer
 * @returns {Promise<{message:{body:string[]}}>}
 */
export async function del(slug, viewer) {
  const article = await findOrThrow(slug);
  await assertAuthor(article, viewer);
  await article.destroy();
  return { message: { body: ["Article deleted successfully"] } };
}

// ---- internals ----

async function associateTags(article, tagList) {
  for (const raw of tagList) {
    const name = raw.trim();
    if (name.length < 1) continue;
    const existing = await Tag.findByPk(name);
    const tag = existing ?? (await Tag.create({ name }));
    await article.addTagList(tag);
  }
}

async function findOrThrow(slug) {
  const article = await Article.findOne({
    where: { slug },
    include: includeOptions,
  });
  if (!article) throw new NotFoundError("Article");
  return article;
}

async function assertAuthor(article, viewer) {
  const authorId = article.author?.id ?? article.userId;
  if (!viewer || viewer.id !== authorId) throw new ForbiddenError("article");
}

async function getEnriched(slug, viewer) {
  const article = await findOrThrow(slug);
  const ctx = await buildEnrichmentContext(viewer, [article.id]);
  return articleToJSON(article, ctx);
}

// re-export sequelize for query-count tests
export { sequelize };
