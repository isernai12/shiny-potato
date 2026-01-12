import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "../../../../../lib/auth";
import { readPosts, writePosts } from "../../../../../lib/data/posts";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest, context: { params: { slug: string } }) {
  const auth = await requireUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  try {
    const body = await request.json();
    if (!body.content || typeof body.content !== "string") {
      return NextResponse.json({ error: "Comment required" }, { status: 400 });
    }
    const data = await readPosts();
    const target = data.records.find((post) => post.slug === context.params.slug);
    if (!target) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    const updated = data.records.map((post) => {
      if (post.slug !== context.params.slug) return post;
      const comments = post.comments ?? [];
      return {
        ...post,
        comments: [
          ...comments,
          {
            id: randomUUID(),
            userId: auth.user.id,
            content: body.content,
            createdAt: new Date().toISOString(),
            likes: []
          }
        ]
      };
    });
    await writePosts(updated);
    const post = updated.find((record) => record.slug === context.params.slug);
    return NextResponse.json({ comments: post?.comments ?? [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to comment" },
      { status: 400 }
    );
  }
}
