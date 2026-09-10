// ArticlesPreview (ported from frontend/src/components/ArticlesPreview). Presentational.
// react-router Link -> next/link; the legacy `state`-passing is dropped (the article page
// server-fetches by slug in the Next.js version).

import Link from "next/link";
import ArticleMeta from "./ArticleMeta.jsx";
import ArticleTags from "./ArticleTags.jsx";

export default function ArticlesPreview({ articles = [], loading = false }) {
  if (articles.length === 0) {
    return (
      <div className="article-preview">
        {loading ? "Loading article..." : "No articles available."}
      </div>
    );
  }

  return articles.map((article) => (
    <div className="article-preview" key={article.slug}>
      <ArticleMeta author={article.author} createdAt={article.createdAt} />
      <Link href={`/article/${article.slug}`} className="preview-link">
        <h1>{article.title}</h1>
        <p>{article.description}</p>
        <span>Read more...</span>
        <ArticleTags tagList={article.tagList} />
      </Link>
    </div>
  ));
}
