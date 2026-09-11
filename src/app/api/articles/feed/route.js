// Route Handler: GET /api/articles/feed (personal feed, requires auth) — Story 1.4.

import { NextResponse } from "next/server";
import { requireSessionUser } from "../../../../lib/auth.js";
import { feed } from "../../../../lib/services/articles.js";
import { statusFor, toErrorResponse } from "../../../../lib/errors.js";

export async function GET(request) {
  try {
    const viewer = await requireSessionUser(request);
    const query = Object.fromEntries(new URL(request.url).searchParams);
    return NextResponse.json(await feed(viewer, query), { status: 200 });
  } catch (error) {
    return NextResponse.json(toErrorResponse(error), {
      status: statusFor(error),
    });
  }
}
