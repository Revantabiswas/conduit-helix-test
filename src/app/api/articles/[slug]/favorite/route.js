// Route Handlers: POST/DELETE /api/articles/:slug/favorite — Story 1.5. Both require auth.

import { NextResponse } from "next/server";
import { requireSessionUser } from "../../../../../lib/auth.js";
import { toggle } from "../../../../../lib/services/favorites.js";
import { statusFor, toErrorResponse } from "../../../../../lib/errors.js";

async function handle(request, params, favorite) {
  try {
    const viewer = await requireSessionUser(request);
    const { slug } = await params;
    return NextResponse.json(await toggle(slug, viewer, favorite), {
      status: 200,
    });
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
