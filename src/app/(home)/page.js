// Home page (Story 1.7, refined in 1.9 to use the ported components).
// Server Component: feed selection + pagination are URL search params (FeedContext eliminated).

import { getServerSession } from "../../lib/session.js";
import { getHomePage } from "../../lib/services/home-page.js";
import BannerContainer from "../../components/BannerContainer.jsx";
import FeedToggler from "../../components/FeedToggler.jsx";
import ArticlesPreview from "../../components/ArticlesPreview.jsx";
import PopularTags from "../../components/ArticleTagsSidebar.jsx";

export default async function HomePage({ searchParams }) {
  const params = await searchParams;
  const viewer = await getServerSession();
  const { articles, tags, mode } = await getHomePage(params, viewer);

  return (
    <div className="home-page">
      {!viewer && (
        <BannerContainer>
          <h1 className="logo-font">conduit helix aire test</h1>
          <p>A place to share your knowledge.</p>
        </BannerContainer>
      )}
      <div className="container page">
        <div className="row">
          <div className="col-md-9">
            <FeedToggler mode={mode} showPersonal={Boolean(viewer)} />
            <ArticlesPreview articles={articles} />
          </div>
          <div className="col-md-3">
            <PopularTags tags={tags} />
          </div>
        </div>
      </div>
    </div>
  );
}
