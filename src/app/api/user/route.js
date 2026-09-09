// Route Handlers: GET /api/user (current user) & PUT /api/user (update) — Story 1.3.
// Both require authentication (requireSessionUser). Thin adapters over the user service.

import { NextResponse } from "next/server";
import { requireSessionUser } from "../../../lib/auth.js";
import { getCurrent, update } from "../../../lib/services/user.js";
import { statusFor, toErrorResponse } from "../../../lib/errors.js";

export async function GET(request) {
  try {
    const user = await requireSessionUser(request);
    return NextResponse.json(getCurrent(user), { status: 200 });
  } catch (error) {
    return NextResponse.json(toErrorResponse(error), {
      status: statusFor(error),
    });
  }
}

export async function PUT(request) {
  try {
    const user = await requireSessionUser(request);
    const body = await request.json();
    const result = await update(user, body?.user ?? {});
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(toErrorResponse(error), {
      status: statusFor(error),
    });
  }
}
