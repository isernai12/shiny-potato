import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "../../../../../../lib/auth";
import { readPosts, updatePost } from "../../../../../../lib/data/posts";

export async function POST(request: NextRequest, context: { params: { id: string } }) {
  const auth = await requireRole(request, ["user", "admin"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  try {
    const data = await readPosts();
    const existing = data.records.find((post) => post.id === context.params.id);
    if (!existing) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    if (existing.authorUserId !== auth.user.id && auth.user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (existing.status === "submitted") {
      return NextResponse.json({ error: "Already submitted" }, { status: 400 });
    }
    const updated = await updatePost(context.params.id, {
      status: "submitted",
      submittedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return NextResponse.json({ post: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Submit failed" },
      { status: 400 }
    );
  }
}
