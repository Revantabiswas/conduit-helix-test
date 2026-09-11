// Route Handler: POST /api/users/login — Story 1.2 (REQ-F-10, REQ-F-15).
// Thin adapter over the users service; sets the httpOnly session cookie on success.
// NEVER imports a Sequelize model directly (ARCH-01).

import { NextResponse } from "next/server";
import { login } from "../../../../lib/services/users.js";
import { sessionCookie } from "../../../../lib/auth.js";
import { statusFor, toErrorResponse } from "../../../../lib/errors.js";

export async function POST(request) {
  try {
    const body = await request.json();
    const { user, token } = await login(body?.user ?? {});

    const response = NextResponse.json({ user }, { status: 200 });
    response.cookies.set(sessionCookie(token));
    return response;
  } catch (error) {
    return NextResponse.json(toErrorResponse(error), {
      status: statusFor(error),
    });
  }
}
