import Link from "next/link";
import { readPosts } from "../lib/data/posts";
import { filterPostsByStatus, sortPostsByDate } from "../lib/data/posts";

export default async function HomePage() {
  const data = await readPosts();
  const approved = sortPostsByDate(filterPostsByStatus(data.records, "approved"));

  return (
    <main className="container stack">
      <h1>Writo Feed</h1>
      {approved.length === 0 ? (
        <p>No approved posts yet.</p>
      ) : (
        <div className="grid two">
          {approved.map((post) => (
            <article className="card stack" key={post.id}>
              <div className="stack" style={{ gap: 8 }}>
                <h2>{post.title}</h2>
                <p>{post.excerpt}</p>
                <div className="badge">{post.tags.join(", ") || "No tags"}</div>
              </div>
              <Link className="button secondary" href={`/post/${post.slug}`}>
                Read post
              </Link>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
