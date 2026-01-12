import Link from "next/link";
import { readPosts } from "../../../lib/data/posts";
import { readUsers } from "../../../lib/data/users";
import styles from "./writer.module.css";

export const dynamic = "force-dynamic";

export default async function WriterPublicPage({
  params
}: {
  params: { id: string };
}) {
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

  return (
    <main className={styles.page}>
      <div className={styles.profileCard}>
        {writer?.avatarUrl ? (
          <img className={styles.avatar} src={writer.avatarUrl} alt={writer.fullName} />
        ) : (
          <div className={`${styles.avatar} ${styles.avatarPlaceholder}`}>
            {writer?.fullName?.charAt(0) ?? "W"}
          </div>
        )}
        <div className={styles.profileMeta}>
          <h1 className={styles.title}>{writer?.fullName ?? "Writer"}</h1>
          <p className={styles.muted}>Recent posts: {sorted.length}</p>
        </div>
      </div>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Recent 5 posts</h2>
          <Link className={styles.buttonSecondary} href={`/writer/${params.id}/posts`}>
            View all
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className={styles.muted}>No posts yet.</p>
        ) : (
          <div className={styles.list}>
            {recent.map((post) => (
              <div key={post.id} className={styles.card}>
                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{post.title}</h3>
                  <p className={styles.cardExcerpt}>{post.excerpt}</p>
                </div>
                <Link className={styles.buttonSecondary} href={`/post/${post.slug}`}>
                  Read post
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
