import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "../../../../lib/auth";
import { createPost, readPosts } from "../../../../lib/data/posts";

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ["writer", "admin"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const data = await readPosts();
  const posts = data.records.filter((post) => post.authorUserId === auth.user.id);
  return NextResponse.json({ posts });
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ["writer", "admin"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  try {
    const body = await request.json();
    if (!body.title || !body.content || !body.excerpt) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    if (!body.category) {
      return NextResponse.json({ error: "Category required" }, { status: 400 });
    }
    const post = await createPost({
      title: body.title,
      content: body.content,
      excerpt: body.excerpt,
      thumbnailLatestUrl: body.thumbnailLatestUrl,
      thumbnailTrendingUrl: body.thumbnailTrendingUrl,
      category: body.category,
      tags: Array.isArray(body.tags) ? body.tags : [],
      authorUserId: auth.user.id
    });
    return NextResponse.json({ post });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Create failed" },
      { status: 400 }
    );
  }
}
