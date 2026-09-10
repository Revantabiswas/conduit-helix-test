// Home page (Story 1.7, REQ-F-20, REQ-F-29) — minimal functional Server Component.
// Feed selection (global/personal/tag) + pagination are URL search params, not client
// state (FeedContext is eliminated); switching feeds is a <Link> navigation.
// Story 1.9 ports the real BannerContainer/FeedToggler/PopularTags components + CSS.

import Link from "next/link";
import { getServerSession } from "../../lib/session.js";
import { getHomePage } from "../../lib/services/home-page.js";

export default async function HomePage({ searchParams }) {
  const params = await searchParams;
  const viewer = await getServerSession();
  const { articles, articlesCount, tags, mode } = await getHomePage(
    params,
    viewer,
  );

  return (
    <main>
      <h1>conduit</h1>

      <nav aria-label="feed-toggler">
        <Link href="/">Global Feed</Link>
        {viewer && <Link href="/?feed=personal">Your Feed</Link>}
      </nav>

      <section aria-label="articles">
        <p>
          {mode} feed — {articlesCount} articles
        </p>
        <ul>
          {articles.map((a) => (
            <li key={a.slug}>
              <Link href={`/article/${a.slug}`}>{a.title}</Link> — by{" "}
              {a.author.username} ({a.favoritesCount} ♥)
            </li>
          ))}
        </ul>
      </section>

      <aside aria-label="popular-tags">
        <h2>Popular Tags</h2>
        <ul>
          {tags.map((t) => (
            <li key={t}>
              <Link href={`/?tag=${encodeURIComponent(t)}`}>{t}</Link>
            </li>
          ))}
        </ul>
      </aside>
    </main>
  );
}
