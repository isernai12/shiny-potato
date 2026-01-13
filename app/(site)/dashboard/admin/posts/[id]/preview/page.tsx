import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getUserFromSessionId } from "../../../../../../../lib/auth";
import { readPosts } from "../../../../../../../lib/data/posts";
import { readUsers } from "../../../../../../../lib/data/users";

export const dynamic = "force-dynamic";

export default async function AdminPostPreview({ params }: { params: { id: string } }) {
  const sessionId = cookies().get("writo_session")?.value;
  const user = await getUserFromSessionId(sessionId);
  if (!user || user.role !== "admin") {
    notFound();
  }
  const posts = await readPosts();
  const post = posts.records.find((record) => record.id === params.id);
  if (!post) {
    notFound();
  }
  const users = await readUsers();
  const author = users.records.find((record) => record.id === post.authorUserId);

  return (
    <main className="container stack">
      <article className="card stack">
        <h1>{post.title}</h1>
        <p>By {author?.fullName ?? "Unknown"}</p>
        <p>Status: {post.status}</p>
        <p>{post.excerpt}</p>
        <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit" }}>{post.content}</pre>
      </article>
    </main>
  );
}
