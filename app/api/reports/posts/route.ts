import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "../../../../lib/auth";
import { createPostReport } from "../../../../lib/data/reports";
import { readPosts } from "../../../../lib/data/posts";

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  try {
    const body = await request.json();
    if (!body.postId || !body.reason) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    const posts = await readPosts();
    const post = posts.records.find((record) => record.id === body.postId);
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    const report = await createPostReport({
      postId: post.id,
      postSlug: post.slug,
      reporterUserId: auth.user.id,
      reason: body.reason
    });
    return NextResponse.json({ report });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Report failed" },
      { status: 400 }
    );
  }
}
