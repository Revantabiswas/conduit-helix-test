// Route Handler: POST /api/users (register) — Story 1.2 (REQ-F-10, REQ-F-15).
// Thin adapter: parse the request, call the users service, set the httpOnly session
// cookie, shape the Conduit response. NEVER imports a Sequelize model directly (ARCH-01).

import { NextResponse } from "next/server";
import { register } from "../../../lib/services/users.js";
import { sessionCookie } from "../../../lib/auth.js";
import { statusFor, toErrorResponse } from "../../../lib/errors.js";

export async function POST(request) {
  try {
    const body = await request.json();
    const { user, token } = await register(body?.user ?? {});

    const response = NextResponse.json({ user }, { status: 201 });
    response.cookies.set(sessionCookie(token));
    return response;
  } catch (error) {
    return NextResponse.json(toErrorResponse(error), {
      status: statusFor(error),
    });
  }
}
