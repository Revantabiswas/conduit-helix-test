// Article view page (Story 1.7, refined in 1.9 to use the ported components).
// Server Component: renders the article (markdown body) + meta + comments.

import Markdown from "markdown-to-jsx";
import { getServerSession } from "../../../lib/session.js";
import { getArticlePage } from "../../../lib/services/article-page.js";
import { NotFoundError } from "../../../lib/errors.js";
import BannerContainer from "../../../components/BannerContainer.jsx";
import ArticleMeta from "../../../components/ArticleMeta.jsx";
import ArticleTags from "../../../components/ArticleTags.jsx";
import CommentList from "../../../components/CommentList.jsx";

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const viewer = await getServerSession();

  let data;
  try {
    data = await getArticlePage(slug, viewer);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return (
        <main className="article-page">
          <h1>Article not found</h1>
        </main>
      );
    }
    throw error;
  }

  const { article, comments } = data;

  return (
    <div className="article-page">
      <BannerContainer>
        <h1>{article.title}</h1>
        <ArticleMeta author={article.author} createdAt={article.createdAt} />
      </BannerContainer>

      <div className="container page">
        <div className="row article-content">
          <div className="col-md-12">
            <Markdown>{article.body || ""}</Markdown>
            <ArticleTags tagList={article.tagList} />
          </div>
        </div>

        <div className="row">
          <div className="col-xs-12 col-md-8 offset-md-2">
            <CommentList comments={comments} />
          </div>
        </div>
      </div>
    </div>
  );
}
