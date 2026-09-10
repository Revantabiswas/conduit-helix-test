// Home-page data assembler (Story 1.7, REQ-F-20). Composes the feed-params resolver with
// the existing N+1-free articles + tags services (1.4). Personal feed uses articles.feed;
// global/tag uses articles.list.

import { resolveFeed } from "../feed-params.js";
import { list, feed as personalFeed } from "./articles.js";
import { list as listTags } from "./tags.js";

/**
 * Assemble the home page for the given search params and viewer.
 * @param {Record<string,string>|URLSearchParams} searchParams
 * @param {import('sequelize').Model|null} viewer
 * @returns {Promise<{ articles: object[], articlesCount: number, tags: string[], mode: string, page: number }>}
 */
export async function getHomePage(searchParams, viewer = null) {
  const { mode, listQuery, page } = resolveFeed(searchParams, Boolean(viewer));

  let result;
  if (mode === "personal") {
    result = await personalFeed(viewer, listQuery);
  } else {
    result = await list(listQuery, viewer);
  }

  const { tags } = await listTags();

  return {
    articles: result.articles,
    articlesCount: result.articlesCount,
    tags,
    mode,
    page,
  };
}
