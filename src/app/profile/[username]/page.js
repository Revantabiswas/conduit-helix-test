// Profile page (Story 1.8, REQ-F-23) — minimal functional Server Component.
// Renders the user's own + favorited articles and the follow status, via getProfilePage.
// Story 1.9 ports the real Profile components + CSS.

import { getServerSession } from "../../../lib/session.js";
import { getProfilePage } from "../../../lib/services/profile-page.js";
import { NotFoundError } from "../../../lib/errors.js";

export default async function ProfilePage({ params }) {
  const { username } = await params;
  const viewer = await getServerSession();

  let data;
  try {
    data = await getProfilePage(username, viewer);
  } catch (error) {
    if (error instanceof NotFoundError) {
      return (
        <main>
          <h1>Profile not found</h1>
        </main>
      );
    }
    throw error;
  }

  const { profile, articles, favorited } = data;

  return (
    <main>
      <h1>{profile.username}</h1>
      {profile.bio && <p>{profile.bio}</p>}
      <p>
        {profile.following ? "Following" : "Not following"} ·{" "}
        {profile.followersCount} followers
      </p>

      <section aria-label="own-articles">
        <h2>My Articles ({articles.length})</h2>
        <ul>
          {articles.map((a) => (
            <li key={a.slug}>{a.title}</li>
          ))}
        </ul>
      </section>

      <section aria-label="favorited-articles">
        <h2>Favorited Articles ({favorited.length})</h2>
        <ul>
          {favorited.map((a) => (
            <li key={a.slug}>{a.title}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}
