"use client";
// Register page (Story 1.6, REQ-F-24) — minimal functional Client Component.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost, normaliseErrors } from "../../lib/client-api.js";
import { buildRegisterPayload } from "../../lib/auth-payloads.js";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState([]);

  async function onSubmit(e) {
    e.preventDefault();
    const { ok, data } = await apiPost(
      "/api/users",
      buildRegisterPayload({ username, email, password }),
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
      <h1>Sign up</h1>
      {errors.length > 0 && (
        <ul aria-label="errors">
          {errors.map((msg) => (
            <li key={msg}>{msg}</li>
          ))}
        </ul>
      )}
      <form onSubmit={onSubmit}>
        <input
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Sign up</button>
      </form>
    </main>
  );
}
