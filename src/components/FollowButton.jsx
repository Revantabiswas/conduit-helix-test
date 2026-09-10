"use client";
// FollowButton (ported from frontend/src/components/FollowButton) — Client Component.

export default function FollowButton({ username, following, onChange }) {
  async function toggle() {
    const method = following ? "DELETE" : "POST";
    const res = await fetch(`/api/profiles/${username}/follow`, {
      method,
      credentials: "include",
    });
    if (res.ok && onChange) {
      const { profile } = await res.json();
      onChange(profile);
    }
  }

  return (
    <button
      type="button"
      className={`btn btn-sm ${following ? "btn-secondary" : "btn-outline-secondary"}`}
      onClick={toggle}
    >
      <i className="ion-plus-round" /> {following ? "Unfollow" : "Follow"}{" "}
      {username}
    </button>
  );
}
