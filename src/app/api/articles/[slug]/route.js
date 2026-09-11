// Route Handlers: GET/PUT/DELETE /api/articles/:slug — Story 1.4.
// GET is soft-auth; PUT/DELETE require auth and are author-only (enforced in the service).

import { NextResponse } from "next/server";
import { getSessionUser, requireSessionUser } from "../../../../lib/auth.js";
import { get, update, del } from "../../../../lib/services/articles.js";
import { statusFor, toErrorResponse } from "../../../../lib/errors.js";

export async function GET(request, { params }) {
  try {
    const viewer = await getSessionUser(request);
    const { slug } = await params;
    return NextResponse.json(await get(slug, viewer), { status: 200 });
  } catch (error) {
    return NextResponse.json(toErrorResponse(error), {
      status: statusFor(error),
    });
  }
}

export async function PUT(request, { params }) {
  try {
    const viewer = await requireSessionUser(request);
    const { slug } = await params;
    const body = await request.json();
    return NextResponse.json(await update(slug, viewer, body?.article ?? {}), {
      status: 200,
    });
  } catch (error) {
    return NextResponse.json(toErrorResponse(error), {
      status: statusFor(error),
    });
  }
}

export async function DELETE(request, { params }) {
  try {
    const viewer = await requireSessionUser(request);
    const { slug } = await params;
    return NextResponse.json(await del(slug, viewer), { status: 200 });
  } catch (error) {
    return NextResponse.json(toErrorResponse(error), {
      status: statusFor(error),
    });
  }
}
