// Route Handlers: GET /api/articles/:slug/comments (list) & POST (create) — Story 1.5.

import { NextResponse } from "next/server";
import { getSessionUser, requireSessionUser } from "../../../../../lib/auth.js";
import { list, create } from "../../../../../lib/services/comments.js";
import { statusFor, toErrorResponse } from "../../../../../lib/errors.js";

export async function GET(request, { params }) {
  try {
    await getSessionUser(request); // soft auth (kept for parity; list is public)
    const { slug } = await params;
    return NextResponse.json(await list(slug), { status: 200 });
  } catch (error) {
    return NextResponse.json(toErrorResponse(error), {
      status: statusFor(error),
    });
  }
}

export async function POST(request, { params }) {
  try {
    const viewer = await requireSessionUser(request);
    const { slug } = await params;
    const body = await request.json();
    return NextResponse.json(
      await create(slug, viewer, body?.comment?.body),
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(toErrorResponse(error), {
      status: statusFor(error),
    });
  }
}
