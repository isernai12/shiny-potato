import { notFound } from "next/navigation";
import { readPosts } from "../../../lib/data/posts";

export default async function PostPage({ params }: { params: { slug: string } }) {
  const data = await readPosts();
  const post = data.records.find(
    (record) => record.slug === params.slug && record.status === "approved"
  );
  if (!post) {
    notFound();
  }
  return (
    <main className="container stack">
      <article className="card stack">
        <h1>{post.title}</h1>
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
