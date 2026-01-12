import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "../../../../../lib/auth";
import { readPosts, writePosts } from "../../../../../lib/data/posts";

export async function POST(request: NextRequest, context: { params: { slug: string } }) {
  const auth = await requireUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  try {
    const data = await readPosts();
    const target = data.records.find((post) => post.slug === context.params.slug);
    if (!target) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }
    const updated = data.records.map((post) => {
      if (post.slug !== context.params.slug) return post;
      const likes = post.likes ?? [];
      const hasLoved = likes.includes(auth.user.id);
      return {
        ...post,
        likes: hasLoved ? likes.filter((id) => id !== auth.user.id) : [...likes, auth.user.id]
      };
    });
    await writePosts(updated);
    const post = updated.find((record) => record.slug === context.params.slug);
    return NextResponse.json({ likes: post?.likes ?? [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to react" },
      { status: 400 }
    );
  }
}
