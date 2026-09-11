// ArticleTags (ported from frontend/src/components/ArticleTags). Presentational.

export default function ArticleTags({ tagList = [] }) {
  return (
    <ul className="tag-list">
      {tagList.map((tag) => (
        <li className="tag-default tag-pill tag-outline" key={tag}>
          {tag}
        </li>
      ))}
    </ul>
  );
}
