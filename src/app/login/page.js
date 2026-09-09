"use client";
// Login page (Story 1.6, REQ-F-24) — minimal functional Client Component.
// Story 1.9 ports the real AuthPageContainer/LoginForm components + CSS.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost, normaliseErrors } from "../../lib/client-api.js";
import { buildLoginPayload } from "../../lib/auth-payloads.js";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState([]);

  async function onSubmit(e) {
    e.preventDefault();
    const { ok, data } = await apiPost(
      "/api/users/login",
      buildLoginPayload({ email, password }),
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
      <h1>Sign in</h1>
      {errors.length > 0 && (
        <ul aria-label="errors">
          {errors.map((msg) => (
            <li key={msg}>{msg}</li>
          ))}
        </ul>
      )}
      <form onSubmit={onSubmit}>
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
        <button type="submit">Sign in</button>
      </form>
    </main>
  );
}
