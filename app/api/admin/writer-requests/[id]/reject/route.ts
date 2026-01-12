import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "../../../../../../lib/auth";
import { updateWriterRequest } from "../../../../../../lib/data/writerRequests";

export async function POST(request: NextRequest, context: { params: { id: string } }) {
  const auth = await requireRole(request, ["admin"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  try {
    const body = await request.json().catch(() => ({ note: "" }));
    const updated = await updateWriterRequest(context.params.id, {
      status: "rejected",
      reviewedAt: new Date().toISOString(),
      reviewNote: body.note || undefined
    });
    return NextResponse.json({ request: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Rejection failed" },
      { status: 400 }
    );
  }
}
