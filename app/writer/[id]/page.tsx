import Link from "next/link";
import { readPosts } from "../../../lib/data/posts";
import { readUsers } from "../../../lib/data/users";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

export default async function WriterPublicPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams: { page?: string };
}) {
  const page = Number(searchParams.page ?? "1");
  const currentPage = Number.isNaN(page) || page < 1 ? 1 : page;
  const data = await readPosts();
  const users = await readUsers();
  const writer = users.records.find((user) => user.id === params.id);
  const posts = data.records.filter(
    (post) => post.authorUserId === params.id && post.status === "approved"
  );
  const sorted = posts.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const recent = sorted.slice(0, 5);
  const paged = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const hasNext = sorted.length > currentPage * PAGE_SIZE;

  return (
    <main className="container stack">
      <div className="card writer-profile">
        {writer?.avatarUrl ? (
          <img className="writer-profile__avatar" src={writer.avatarUrl} alt={writer.fullName} />
        ) : (
          <div className="writer-profile__avatar writer-profile__avatar--placeholder">
            {writer?.fullName?.charAt(0) ?? "W"}
          </div>
        )}
        <div>
          <h1>{writer?.fullName ?? "Writer"}</h1>
          <p>Recent posts: {sorted.length}</p>
        </div>
      </div>

      <section className="stack">
        <h2>Recent 5 posts</h2>
        {recent.length === 0 ? (
          <p>No posts yet.</p>
        ) : (
          <div className="stack">
            {recent.map((post) => (
              <div key={post.id} className="card stack">
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
                <Link className="button secondary" href={`/post/${post.slug}`}>
                  Read post
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="stack">
        <h2>All posts</h2>
        {paged.length === 0 ? (
          <p>No posts found.</p>
        ) : (
          <div className="stack">
            {paged.map((post) => (
              <div key={post.id} className="card stack">
                <h3>{post.title}</h3>
                <p>{post.excerpt}</p>
                <Link className="button secondary" href={`/post/${post.slug}`}>
                  Read post
                </Link>
              </div>
            ))}
          </div>
        )}
        <div className="pager">
          {currentPage > 1 ? (
            <Link className="button secondary" href={`/writer/${params.id}?page=${currentPage - 1}`}>
              Previous
            </Link>
          ) : null}
          {hasNext ? (
            <Link className="button secondary" href={`/writer/${params.id}?page=${currentPage + 1}`}>
              Next
            </Link>
          ) : null}
        </div>
      </section>
    </main>
  );
}
