import Link from "next/link";
import { readPosts } from "../../../../lib/data/posts";
import { readUsers } from "../../../../lib/data/users";
import styles from "./posts.module.css";

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
    <main className={styles.page}>
      <h1 className={styles.title}>{writer?.fullName ?? "User"} posts</h1>
      {paged.length === 0 ? (
        <p className={styles.muted}>No posts found.</p>
      ) : (
        <div className={styles.list}>
          {paged.map((post) => (
            <article key={post.id} className={styles.card}>
              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>{post.title}</h3>
                <p className={styles.cardExcerpt}>{post.excerpt}</p>
              </div>
              <Link className={styles.buttonSecondary} href={`/post/${post.slug}`}>
                Read
              </Link>
            </article>
          ))}
        </div>
      )}
      <div className={styles.pager}>
        {Array.from({ length: pageCount }).map((_, index) => {
          const pageNumber = index + 1;
          return (
            <Link
              key={pageNumber}
              className={`${styles.buttonSecondary} ${
                pageNumber === currentPage ? styles.active : ""
              }`}
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
