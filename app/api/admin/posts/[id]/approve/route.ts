import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireRole } from "../../../../../../lib/auth";
import { updatePost } from "../../../../../../lib/data/posts";

export async function POST(request: NextRequest, context: { params: { id: string } }) {
  const auth = await requireRole(request, ["admin"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  try {
    const updated = await updatePost(context.params.id, {
      status: "approved",
      reviewedAt: new Date().toISOString(),
      reviewNote: undefined,
      updatedAt: new Date().toISOString()
    });
    revalidatePath("/");
    revalidatePath(`/post/${updated.slug}`);
    return NextResponse.json({ post: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Approval failed" },
      { status: 400 }
    );
  }
}
