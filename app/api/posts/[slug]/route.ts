import { NextRequest, NextResponse } from "next/server";
import { readPosts } from "../../../../lib/data/posts";

export async function GET(request: NextRequest, context: { params: { slug: string } }) {
  const data = await readPosts();
  const post = data.records.find(
    (record) => record.slug === context.params.slug && record.status === "approved"
  );
  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ post });
}
