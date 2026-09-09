// Route Handler: DELETE /api/articles/:slug/comments/:id — Story 1.5. Author-only.

import { NextResponse } from "next/server";
import { requireSessionUser } from "../../../../../../lib/auth.js";
import { del } from "../../../../../../lib/services/comments.js";
import { statusFor, toErrorResponse } from "../../../../../../lib/errors.js";

export async function DELETE(request, { params }) {
  try {
    const viewer = await requireSessionUser(request);
    const { slug, id } = await params;
    return NextResponse.json(await del(slug, id, viewer), { status: 200 });
  } catch (error) {
    return NextResponse.json(toErrorResponse(error), {
      status: statusFor(error),
    });
  }
}
