"use client";
// Settings page (Story 1.6, REQ-F-25) — minimal functional Client Component.
// Updates the profile via PUT /api/user and offers logout.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPut, normaliseErrors } from "../../lib/client-api.js";
import { buildSettingsPayload } from "../../lib/auth-payloads.js";
import { logoutAction } from "./actions.js";

export default function SettingsPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    bio: "",
    image: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState([]);

  function set(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    const { ok, data } = await apiPut(
      "/api/user",
      buildSettingsPayload(form),
    );
    if (ok) {
      router.push("/");
      router.refresh();
    } else {
      setErrors(normaliseErrors(data));
    }
  }

  return (
    <main>
      <h1>Your Settings</h1>
      {errors.length > 0 && (
        <ul aria-label="errors">
          {errors.map((msg) => (
            <li key={msg}>{msg}</li>
          ))}
        </ul>
      )}
      <form onSubmit={onSubmit}>
        <input placeholder="Bio" value={form.bio} onChange={set("bio")} />
        <input
          placeholder="Image URL"
          value={form.image}
          onChange={set("image")}
        />
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={set("email")}
        />
        <input
          type="password"
          placeholder="New password (leave blank to keep)"
          value={form.password}
          onChange={set("password")}
        />
        <button type="submit">Update Settings</button>
      </form>
      <form action={logoutAction}>
        <button type="submit">Log out</button>
      </form>
    </main>
  );
}
