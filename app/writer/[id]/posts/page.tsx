import Link from "next/link";
import { readPosts } from "../../../../lib/data/posts";
import { readUsers } from "../../../../lib/data/users";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

export default async function WriterPostsPage({
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
  const posts = data.records
    .filter((post) => post.authorUserId === params.id && post.status === "approved")
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const paged = posts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const pageCount = Math.max(1, Math.ceil(posts.length / PAGE_SIZE));

  return (
    <main className="container stack">
      <h1>{writer?.fullName ?? "User"} posts</h1>
      {paged.length === 0 ? (
        <p>No posts found.</p>
      ) : (
        <div className="stack">
          {paged.map((post) => (
            <article key={post.id} className="card stack">
              <h3>{post.title}</h3>
              <p>{post.excerpt}</p>
              <Link className="button secondary" href={`/post/${post.slug}`}>
                Read
              </Link>
            </article>
          ))}
        </div>
      )}
      <div className="pager">
        {Array.from({ length: pageCount }).map((_, index) => {
          const pageNumber = index + 1;
          return (
            <Link
              key={pageNumber}
              className={`button secondary ${pageNumber === currentPage ? "active" : ""}`}
              href={`/writer/${params.id}/posts?page=${pageNumber}`}
            >
              {pageNumber}
            </Link>
          );
        })}
      </div>
    </main>
  );
}
