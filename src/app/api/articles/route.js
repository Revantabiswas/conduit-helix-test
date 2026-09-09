// Route Handlers: GET /api/articles (list, soft auth) & POST /api/articles (create) — Story 1.4.

import { NextResponse } from "next/server";
import { getSessionUser, requireSessionUser } from "../../../lib/auth.js";
import { list, create } from "../../../lib/services/articles.js";
import { statusFor, toErrorResponse } from "../../../lib/errors.js";

export async function GET(request) {
  try {
    const viewer = await getSessionUser(request);
    const query = Object.fromEntries(new URL(request.url).searchParams);
    return NextResponse.json(await list(query, viewer), { status: 200 });
  } catch (error) {
    return NextResponse.json(toErrorResponse(error), {
      status: statusFor(error),
    });
  }
}

export async function POST(request) {
  try {
    const author = await requireSessionUser(request);
    const body = await request.json();
    return NextResponse.json(await create(author, body?.article ?? {}), {
      status: 201,
    });
  } catch (error) {
    return NextResponse.json(toErrorResponse(error), {
      status: statusFor(error),
    });
  }
}
