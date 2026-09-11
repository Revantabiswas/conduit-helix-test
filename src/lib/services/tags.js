// Tags service — list all tag names (Story 1.4, REQ-F-14).
// Ported from backend/routes/tags.js.

import { Tag } from "../db/index.js";

/**
 * List every tag name.
 * @returns {Promise<{ tags: string[] }>}
 */
export async function list() {
  const rows = await Tag.findAll({ attributes: ["name"] });
  return { tags: rows.map((t) => t.name) };
}
