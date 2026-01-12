import { NextResponse } from "next/server";
import { readPosts } from "../../../lib/data/posts";

export async function GET() {
  const data = await readPosts();
  const posts = data.records.filter((post) => post.status === "approved");
  return NextResponse.json({ posts });
}
