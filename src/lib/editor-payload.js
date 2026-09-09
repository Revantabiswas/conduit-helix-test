// Pure payload builder for the article editor (Story 1.8). Extracted from the editor page
// so the request-shaping (incl. tag parsing) is unit-testable without rendering React.

/**
 * Build the Conduit create/update article payload. `tags` is a comma-separated string
 * from the editor's tag input; it is parsed into a trimmed, de-blanked array.
 * @param {{title:string, description:string, body:string, tags?:string}} form
 * @returns {{ article: { title:string, description:string, body:string, tagList:string[] } }}
 */
export function buildArticlePayload({ title, description, body, tags = "" }) {
  const tagList = tags
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
  return { article: { title, description, body, tagList } };
}
