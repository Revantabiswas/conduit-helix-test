// Article view page (Story 1.7, REQ-F-21) — minimal functional Server Component.
// Renders the article (markdown body) + author meta + comments.
// Story 1.9 ports the real ArticleMeta/ArticleTags/CommentList components + CSS.

import Markdown from "markdown-to-jsx";
import Link from "next/link";
import { getServerSession } from "../../../lib/session.js";
import { getArticlePage } from "../../../lib/services/article-page.js";
import { NotFoundError } from "../../../lib/errors.js";

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const viewer = await getServerSession();

  let data;
  try {
    data = await getArticlePage(slug, viewer);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return (
        <main>
          <h1>Article not found</h1>
        </main>
      );
    }
    throw error;
  }

  const { article, comments } = data;

  return (
    <main>
      <article>
        <h1>{article.title}</h1>
        <p>
          by{" "}
          <Link href={`/profile/${article.author.username}`}>
            {article.author.username}
          </Link>{" "}
          · {article.favoritesCount} ♥
        </p>
        <div>
          <Markdown>{article.body || ""}</Markdown>
        </div>
        <ul aria-label="tags">
          {article.tagList.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </article>

      <section aria-label="comments">
        <h2>Comments ({comments.length})</h2>
        <ul>
          {comments.map((c) => (
            <li key={c.id}>
              <strong>{c.author?.username}</strong>: {c.body}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
