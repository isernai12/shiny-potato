"use client";

import { useEffect, useState } from "react";
import styles from "./posts.module.css";

type Post = {
  id: string;
  title: string;
  slug: string;
  status: string;
  authorUserId: string;
};

export default function AdminPostReviewPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [note, setNote] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  async function load() {
    const response = await fetch("/api/admin/posts/submitted");
    if (!response.ok) return;
    const data = await response.json();
    setPosts(data.posts ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleApprove(id: string) {
    await fetch(`/api/admin/posts/${id}/approve`, { method: "POST" });
    setMessage("Post approved.");
    load();
  }

  async function handleReject(id: string) {
    await fetch(`/api/admin/posts/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: note[id] || "" })
    });
    setMessage("Post rejected.");
    load();
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Post review</h1>
      {message ? <div className={styles.notice}>{message}</div> : null}
      <div className={styles.card}>
        {posts.length === 0 ? (
          <p className={styles.muted}>No pending posts.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Preview</th>
                <th>Note</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id}>
                  <td>{post.title}</td>
                  <td>{post.authorUserId}</td>
                  <td>
                    <a
                      className={styles.buttonSecondary}
                      href={`/dashboard/admin/posts/${post.id}/preview`}
                    >
                      Preview
                    </a>
                  </td>
                  <td>
                    <input
                      className={styles.input}
                      value={note[post.id] || ""}
                      onChange={(event) =>
                        setNote((prev) => ({ ...prev, [post.id]: event.target.value }))
                      }
                    />
                  </td>
                  <td>
                    <div className={styles.actionStack}>
                      <button className={styles.buttonSecondary} onClick={() => handleApprove(post.id)}>
                        Approve
                      </button>
                      <button className={styles.buttonSecondary} onClick={() => handleReject(post.id)}>
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
