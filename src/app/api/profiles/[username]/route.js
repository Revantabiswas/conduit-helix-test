// Route Handler: GET /api/profiles/:username (public profile) — Story 1.3.
// Soft auth: works anonymously (following=false); a valid session sets the following flag.

import { NextResponse } from "next/server";
import { getSessionUser } from "../../../../lib/auth.js";
import { getProfile } from "../../../../lib/services/profiles.js";
import { statusFor, toErrorResponse } from "../../../../lib/errors.js";

export async function GET(request, { params }) {
  try {
    const viewer = await getSessionUser(request);
    const { username } = await params;
    const result = await getProfile(username, viewer);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(toErrorResponse(error), {
      status: statusFor(error),
    });
  }
}
