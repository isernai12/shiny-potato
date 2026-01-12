"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./posts.module.css";

type Post = {
  id: string;
  title: string;
  status: string;
  reviewNote?: string;
};

type Filter = "all" | "draft" | "pending" | "published";

export default function WriterPostsPage() {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function load() {
      const meResponse = await fetch("/api/me");
      if (meResponse.ok) {
        const meData = await meResponse.json();
        setIsAdmin(meData.user?.role === "admin");
      }
      const response = await fetch("/api/writer/posts");
      if (!response.ok) return;
      const data = await response.json();
      setPosts(data.posts ?? []);
    }
    load();
  }, []);

  if (isAdmin) {
    return (
      <main className={styles.page}>
        <h1 className={styles.title}>Manage posts</h1>
        <p className={styles.muted}>Admin accounts cannot manage posts.</p>
        <button className={styles.buttonSecondary} onClick={() => router.push("/dashboard/admin")}>
          Go to admin dashboard
        </button>
      </main>
    );
  }

  const filtered = useMemo(() => {
    if (filter === "all") return posts;
    if (filter === "published") return posts.filter((post) => post.status === "approved");
    if (filter === "pending") return posts.filter((post) => post.status === "submitted");
    if (filter === "draft") return posts.filter((post) => post.status === "draft");
    return posts;
  }, [posts, filter]);

  async function handleSubmit(postId: string) {
    setMessage("");
    setError("");
    const response = await fetch(`/api/writer/posts/${postId}/submit`, { method: "POST" });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error || "Failed to submit");
      return;
    }
    const data = await response.json();
    setPosts((prev) => prev.map((post) => (post.id === postId ? data.post : post)));
    setMessage("Post submitted for review.");
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Manage posts</h1>
      {message ? <div className={styles.notice}>{message}</div> : null}
      {error ? <div className={styles.noticeError}>{error}</div> : null}
      <div className={styles.filterWrap}>
        <div className={styles.filterBar}>
          {(["all", "published", "pending", "draft"] as Filter[]).map((key) => (
            <button
              key={key}
              className={`${styles.buttonSecondary} ${filter === key ? styles.active : ""}`}
              type="button"
              onClick={() => setFilter(key)}
            >
              {key}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.card}>
        {filtered.length === 0 ? (
          <p className={styles.muted}>No posts found.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Review note</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((post) => (
                <tr key={post.id}>
                  <td>{post.title}</td>
                  <td>{post.status}</td>
                  <td>{post.reviewNote ?? "-"}</td>
                  <td>
                    {post.status === "draft" ? (
                      <button
                        className={styles.buttonSecondary}
                        type="button"
                        onClick={() => handleSubmit(post.id)}
                      >
                        Submit
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <button className={styles.buttonSecondary} onClick={() => router.push("/dashboard/writer")}>
        Back
      </button>
    </main>
  );
}
