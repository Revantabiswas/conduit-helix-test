// FeedToggler (ported from frontend/src/components/FeedToggler). Presentational.
// The feeds are <Link> navigations (URL-driven, Story 1.7) — not client state.

import Link from "next/link";

export default function FeedToggler({ mode = "global", showPersonal = false }) {
  return (
    <div className="feed-toggle">
      <ul className="nav nav-pills outline-active">
        {showPersonal && (
          <li className="nav-item">
            <Link
              href="/?feed=personal"
              className={`nav-link ${mode === "personal" ? "active" : ""}`}
            >
              Your Feed
            </Link>
          </li>
        )}
        <li className="nav-item">
          <Link
            href="/"
            className={`nav-link ${mode === "global" ? "active" : ""}`}
          >
            Global Feed
          </Link>
        </li>
      </ul>
    </div>
  );
}
