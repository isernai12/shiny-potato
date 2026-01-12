import { notFound } from "next/navigation";
import { readPosts } from "../../../lib/data/posts";
import { readUsers } from "../../../lib/data/users";

export const dynamic = "force-dynamic";

export default async function PostPage({ params }: { params: { slug: string } }) {
  const data = await readPosts();
  const users = await readUsers();
  const post = data.records.find(
    (record) => record.slug === params.slug && record.status === "approved"
  );
  if (!post) {
    notFound();
  }
  const author =
    users.records.find((user) => user.id === post.authorUserId)?.fullName ??
    "Unknown author";
  return (
    <main className="container stack">
      <article className="card stack">
        <h1>{post.title}</h1>
        <p>By {author}</p>
        {post.coverImageUrl ? (
          <img src={post.coverImageUrl} alt={post.title} style={{ width: "100%" }} />
        ) : null}
        <p>{post.excerpt}</p>
        <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
          {post.content}
        </pre>
      </article>
    </main>
  );
}
