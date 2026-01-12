import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "../../../../../../lib/auth";
import { updateWriterRequest } from "../../../../../../lib/data/writerRequests";
import { updateUserRole } from "../../../../../../lib/data/users";

export async function POST(request: NextRequest, context: { params: { id: string } }) {
  const auth = await requireRole(request, ["admin"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  try {
    const updated = await updateWriterRequest(context.params.id, {
      status: "approved",
      reviewedAt: new Date().toISOString()
    });
    await updateUserRole(updated.userId, "writer");
    return NextResponse.json({ request: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Approval failed" },
      { status: 400 }
    );
  }
}
