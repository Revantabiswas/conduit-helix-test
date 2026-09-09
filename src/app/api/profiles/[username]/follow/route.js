// Route Handlers: POST/DELETE /api/profiles/:username/follow — Story 1.3.
// Both require authentication. A single service call handles both directions.

import { NextResponse } from "next/server";
import { requireSessionUser } from "../../../../../lib/auth.js";
import { toggleFollow } from "../../../../../lib/services/profiles.js";
import { statusFor, toErrorResponse } from "../../../../../lib/errors.js";

async function handle(request, params, follow) {
  try {
    const viewer = await requireSessionUser(request);
    const { username } = await params;
    const result = await toggleFollow(username, viewer, follow);
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(toErrorResponse(error), {
      status: statusFor(error),
    });
  }
}

export function POST(request, { params }) {
  return handle(request, params, true);
}

export function DELETE(request, { params }) {
  return handle(request, params, false);
}
