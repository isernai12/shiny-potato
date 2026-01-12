import { NextRequest, NextResponse } from "next/server";
import { readPosts, writePosts } from "../../../../lib/data/posts";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const postId = body.postId as string | undefined;
    const seconds = Number(body.seconds ?? 0);
    if (!postId || Number.isNaN(seconds) || seconds <= 0) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const data = await readPosts();
    const updated = data.records.map((post) => {
      if (post.id !== postId) return post;
      const total = post.engagementTotalSeconds ?? 0;
      const count = post.engagementCount ?? 0;
      return {
        ...post,
        engagementTotalSeconds: total + seconds,
        engagementCount: count + 1
      };
    });
    await writePosts(updated);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to record" }, { status: 400 });
  }
}
