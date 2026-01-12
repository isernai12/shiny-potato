import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireRole } from "../../../../../../lib/auth";
import { updatePost } from "../../../../../../lib/data/posts";
import { appendAuditEntry } from "../../../../../../lib/data/audit";

export async function POST(request: NextRequest, context: { params: { id: string } }) {
  const auth = await requireRole(request, ["admin"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  try {
    const body = await request.json().catch(() => ({ note: "" }));
    const updated = await updatePost(context.params.id, {
      status: "rejected",
      reviewedAt: new Date().toISOString(),
      reviewNote: body.note || undefined,
      updatedAt: new Date().toISOString()
    });
    await appendAuditEntry({
      actorUserId: auth.user.id,
      action: "post_rejected",
      target: updated.id
    });
    revalidatePath(`/post/${updated.slug}`);
    return NextResponse.json({ post: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Rejection failed" },
      { status: 400 }
    );
  }
}
