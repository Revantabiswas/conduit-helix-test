"use server";
// Server Action for logout (Story 1.6, REQ-F-28) — clears the session cookie server-side
// and redirects home. Used by the Settings page's logout form.

import { redirect } from "next/navigation";
import { logout } from "../../lib/session.js";

export async function logoutAction() {
  await logout();
  redirect("/");
}
