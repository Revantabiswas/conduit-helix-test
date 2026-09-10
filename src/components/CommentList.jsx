// CommentList (ported from frontend/src/components/CommentList). Presentational.

import Avatar from "./Avatar.jsx";

export default function CommentList({ comments = [] }) {
  if (comments.length === 0) {
    return <p className="no-comments">No comments yet.</p>;
  }
  return (
    <div className="comment-list">
      {comments.map((comment) => (
        <div className="card" key={comment.id}>
          <div className="card-block">
            <p className="card-text">{comment.body}</p>
          </div>
          <div className="card-footer">
            <Avatar
              src={comment.author?.image}
              alt={comment.author?.username}
              className="comment-author-img"
            />
            <span className="comment-author">{comment.author?.username}</span>
            {comment.createdAt && (
              <span className="date-posted">
                {new Date(comment.createdAt).toDateString()}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
