import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getUserFromSessionId } from "../../../../../../lib/auth";
import { readPosts } from "../../../../../../lib/data/posts";
import { readUsers } from "../../../../../../lib/data/users";
import styles from "./preview.module.css";

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
    <main className={styles.page}>
      <article className={styles.card}>
        <h1 className={styles.title}>{post.title}</h1>
        <p className={styles.meta}>By {author?.fullName ?? "Unknown"}</p>
        <p className={styles.status}>Status: {post.status}</p>
        <p className={styles.excerpt}>{post.excerpt}</p>
        <pre className={styles.content}>{post.content}</pre>
      </article>
    </main>
  );
}
