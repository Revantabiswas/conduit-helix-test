// Profile-page data assembler (Story 1.8, REQ-F-23). Composes the existing profiles and
// articles services (both already N+1-free, ARCH-02) into the data a profile page needs:
// the profile, the user's own articles, and the user's favorited articles.

import { getProfile } from "./profiles.js";
import { list } from "./articles.js";

/**
 * Assemble everything the profile page renders for `username`, as seen by `viewer`.
 * @param {string} username
 * @param {import('sequelize').Model|null} viewer
 * @returns {Promise<{ profile: object, articles: object[], favorited: object[] }>}
 */
export async function getProfilePage(username, viewer = null) {
  // getProfile throws NotFoundError for an unknown user — let it propagate.
  const { profile } = await getProfile(username, viewer);

  const own = await list({ author: username }, viewer);
  const favs = await list({ favorited: username }, viewer);

  return {
    profile,
    articles: own.articles,
    favorited: favs.articles,
  };
}
