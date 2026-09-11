"use client";
// Article editor — edit (Story 1.8, REQ-F-22). Minimal functional Client Component.
// Pre-fills from the existing article via the public GET, submits via PUT.

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiPut, normaliseErrors } from "../../../lib/client-api.js";
import { buildArticlePayload } from "../../../lib/editor-payload.js";

export default function EditArticlePage() {
  const router = useRouter();
  const { slug } = useParams();
  const [form, setForm] = useState({
    title: "",
    description: "",
    body: "",
    tags: "",
  });
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    fetch(`/api/articles/${slug}`, { credentials: "include" })
      .then((r) => r.json())
      .then(({ article }) => {
        if (article) {
          setForm({
            title: article.title ?? "",
            description: article.description ?? "",
            body: article.body ?? "",
            tags: (article.tagList ?? []).join(", "),
          });
        }
      })
      .catch(() => {});
  }, [slug]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    const { ok, data } = await apiPut(
      `/api/articles/${slug}`,
      buildArticlePayload(form),
    );
    if (ok) {
      router.push(`/article/${data.article.slug}`);
      router.refresh();
    } else {
      setErrors(normaliseErrors(data));
    }
  }

  return (
    <main>
      <h1>Edit Article</h1>
      {errors.length > 0 && (
        <ul aria-label="errors">
          {errors.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      )}
      <form onSubmit={onSubmit}>
        <input placeholder="Title" value={form.title} onChange={set("title")} />
        <input
          placeholder="What's this about?"
          value={form.description}
          onChange={set("description")}
        />
        <textarea
          placeholder="Write your article (markdown)"
          value={form.body}
          onChange={set("body")}
        />
        <input
          placeholder="Tags (comma separated)"
          value={form.tags}
          onChange={set("tags")}
        />
        <button type="submit">Update Article</button>
      </form>
    </main>
  );
}
