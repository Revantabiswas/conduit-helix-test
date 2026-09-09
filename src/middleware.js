// Next.js Middleware (Story 1.2, REQ-F-15) — replaces backend/middleware/authentication.js.
//
// Soft auth, matching the legacy verifyToken behaviour: requests without a session cookie
// pass through (public endpoints work anonymously). This middleware does NOT hard-block —
// per-endpoint authorization is enforced in the Route Handlers via requireSessionUser()
// (that keeps authz in the service/handler layer, where the resource is known). The
// middleware exists to make the session available and to centralise the cookie contract.
//
// The JWT is read from the httpOnly cookie only — never from a header or localStorage
// (ARCH-03 / REQ-NF-01).

import { NextResponse } from "next/server";
import { verifySession } from "./lib/auth.js";
import { SESSION_COOKIE } from "./lib/auth.js";

export function middleware(request) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const claims = verifySession(token);

  // Attach a lightweight identity hint for downstream handlers/logging. Handlers still
  // resolve the full user via getSessionUser/requireSessionUser (which re-verify).
  const requestHeaders = new Headers(request.headers);
  if (claims?.email) {
    requestHeaders.set("x-session-email", claims.email);
  } else {
    requestHeaders.delete("x-session-email");
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/api/:path*"],
};
