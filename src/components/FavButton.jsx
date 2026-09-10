"use client";
// FavButton (ported from frontend/src/components/FavButton) — Client Component.
// Calls the favorite API directly via fetch (credentials included for the session cookie).

export default function FavButton({
  favorited,
  favoritesCount,
  slug,
  right,
  onChange,
}) {
  async function toggle() {
    const method = favorited ? "DELETE" : "POST";
    const res = await fetch(`/api/articles/${slug}/favorite`, {
      method,
      credentials: "include",
    });
    if (res.ok && onChange) {
      const { article } = await res.json();
      onChange(article);
    }
  }

  return (
    <button
      type="button"
      className={`btn btn-sm ${favorited ? "btn-primary" : "btn-outline-primary"} ${
        right ? "pull-xs-right" : ""
      }`}
      onClick={toggle}
    >
      <i className="ion-heart" /> {favoritesCount}
    </button>
  );
}
