// Route Handler: GET /api/tags — Story 1.4 (REQ-F-14).

import { NextResponse } from "next/server";
import { list } from "../../../lib/services/tags.js";
import { statusFor, toErrorResponse } from "../../../lib/errors.js";

export async function GET() {
  try {
    return NextResponse.json(await list(), { status: 200 });
  } catch (error) {
    return NextResponse.json(toErrorResponse(error), {
      status: statusFor(error),
    });
  }
}
