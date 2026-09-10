// PopularTags sidebar (ported from frontend/src/components/PopularTags). Presentational.
// Renders tag links that drive the home feed via URL search params (Story 1.7).

import Link from "next/link";

export default function PopularTags({ tags = [] }) {
  return (
    <div className="sidebar">
      <p>Popular Tags</p>
      <div className="tag-list">
        {tags.map((tag) => (
          <Link
            key={tag}
            href={`/?tag=${encodeURIComponent(tag)}`}
            className="tag-pill tag-default"
          >
            {tag}
          </Link>
        ))}
      </div>
    </div>
  );
}
