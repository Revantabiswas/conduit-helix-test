// ArticleMeta (ported from frontend/src/components/ArticleMeta). Presentational.
// Shows the author, avatar and date; children render action buttons (fav/follow).

import Link from "next/link";
import Avatar from "./Avatar.jsx";

export default function ArticleMeta({ author, createdAt, children }) {
  return (
    <div className="article-meta">
      <Link href={`/profile/${author?.username ?? ""}`}>
        <Avatar src={author?.image} alt={author?.username} />
      </Link>
      <div className="info">
        <Link href={`/profile/${author?.username ?? ""}`} className="author">
          {author?.username}
        </Link>
        {createdAt && (
          <span className="date">
            {new Date(createdAt).toDateString()}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
