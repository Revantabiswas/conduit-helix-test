"use client";
// Article editor — create (Story 1.8, REQ-F-22). Minimal functional Client Component.
// Story 1.9 ports the real ArticleEditor component + CSS.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost, normaliseErrors } from "../../lib/client-api.js";
import { buildArticlePayload } from "../../lib/editor-payload.js";

export default function NewArticlePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    description: "",
    body: "",
    tags: "",
  });
  const [errors, setErrors] = useState([]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    const { ok, data } = await apiPost(
      "/api/articles",
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
      <h1>New Article</h1>
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
        <button type="submit">Publish Article</button>
      </form>
    </main>
  );
}
