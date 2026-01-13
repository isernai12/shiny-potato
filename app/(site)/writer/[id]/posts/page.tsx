import Link from "next/link";
import { Calendar, Clock } from "lucide-react";
import { readPosts } from "../../../../../lib/data/posts";
import { readUsers } from "../../../../../lib/data/users";
import styles from "../writer-profile.module.css";

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
    <main className={styles.wrap}>
      <div className={styles.sectionTitleRow}>
        <div className={styles.sectionTitle}>{writer?.fullName ?? "User"} posts</div>
      </div>
      {paged.length === 0 ? (
        <div className={styles.emptyState}>No posts found.</div>
      ) : (
        <div className={styles.postGrid}>
          {paged.map((post) => (
            <article key={post.id} className={styles.postCard}>
              <Link href={`/post/${post.slug}`} className={styles.postLink}>
                <div className={styles.postThumb}>
                  {post.thumbnailLatestUrl || post.thumbnailTrendingUrl ? (
                    <img
                      src={post.thumbnailLatestUrl || post.thumbnailTrendingUrl}
                      alt={post.title}
                    />
                  ) : null}
                </div>
                <div className={styles.postBody}>
                  <div className={styles.postTitle}>{post.title}</div>
                  <div className={styles.postExcerpt}>{post.excerpt}</div>
                  <div className={styles.postMetaRow}>
                    <span className={styles.metaItem}>
                      <Clock size={14} />
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    </span>
                    <span className={styles.metaItem}>
                      <Calendar size={14} />
                      <span>{post.category}</span>
                    </span>
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>
      )}
      <div className={styles.pager}>
        {Array.from({ length: pageCount }).map((_, index) => {
          const pageNumber = index + 1;
          const isActive = pageNumber === currentPage;
          return (
            <Link
              key={pageNumber}
              className={`${styles.pageBtn} ${isActive ? styles.pageBtnActive : ""}`}
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
