/** Follow/unfollow authors. State is an immutable map of follower -> Set(author). */
export function toggleFollow(follows, follower, author) {
  if (!follower || !author) throw new Error("follower and author are required");
  if (follower === author) throw new Error("You cannot follow yourself");
  const next = new Map(follows);
  const set = new Set(next.get(follower) || []);
  if (set.has(author)) set.delete(author); else set.add(author);
  next.set(follower, set);
  return next;
}

export const isFollowing = (follows, follower, author) => Boolean(follows.get(follower)?.has(author));
