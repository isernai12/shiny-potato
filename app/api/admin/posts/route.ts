import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "../../../../lib/auth";
import { readPosts } from "../../../../lib/data/posts";

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ["admin"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const data = await readPosts();
  return NextResponse.json({ posts: data.records });
}
