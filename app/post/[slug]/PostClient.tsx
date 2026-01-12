"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./post.module.css";

type User = {
  id: string;
  fullName: string;
  avatarUrl?: string;
};

type Comment = {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  likes: string[];
};

type Post = {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  category: string;
  tags: string[];
  authorUserId: string;
  createdAt: string;
  likes: string[];
  comments: Comment[];
};

type Viewer = {
  id: string;
  fullName: string;
};

export default function PostClient({
  post,
  author,
  related,
  users
}: {
  post: Post;
  author?: User;
  related: Post[];
  users: User[];
}) {
  const [viewer, setViewer] = useState<Viewer | null>(null);
  const [comments, setComments] = useState<Comment[]>(post.comments || []);
  const [likes, setLikes] = useState<string[]>(post.likes || []);
  const [commentText, setCommentText] = useState("");
  const [error, setError] = useState("");
  const [reportReason, setReportReason] = useState("");

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/me");
      if (!response.ok) return;
      const data = await response.json();
      setViewer(data.user ?? null);
    }
    load();
  }, []);

  useEffect(() => {
    const started = Date.now();
    return () => {
      const seconds = Math.max(1, Math.round((Date.now() - started) / 1000));
      fetch("/api/track/engagement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id, seconds })
      });
    };
  }, [post.id]);

  const liked = viewer ? likes.includes(viewer.id) : false;

  async function toggleLove() {
    setError("");
    const response = await fetch(`/api/posts/${post.slug}/love`, { method: "POST" });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error || "Failed to react");
      return;
    }
    const data = await response.json();
    setLikes(data.likes || []);
  }

  async function addComment(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch(`/api/posts/${post.slug}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: commentText })
    });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error || "Failed to comment");
      return;
    }
    const data = await response.json();
    setComments(data.comments || []);
    setCommentText("");
  }

  async function toggleCommentLove(commentId: string) {
    setError("");
    const response = await fetch(`/api/posts/${post.slug}/comments/${commentId}/love`, {
      method: "POST"
    });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error || "Failed to react");
      return;
    }
    const data = await response.json();
    setComments(data.comments || []);
  }

  async function reportPost() {
    if (!reportReason) {
      setError("Please enter a report reason.");
      return;
    }
    const response = await fetch("/api/reports/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: post.id, reason: reportReason })
    });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error || "Failed to report");
      return;
    }
    setReportReason("");
  }

  async function reportComment(commentId: string) {
    const reason = window.prompt("Report reason?");
    if (!reason) return;
    const response = await fetch("/api/reports/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: post.id, commentId, reason })
    });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error || "Failed to report");
    }
  }

  const commentAuthors = useMemo(() => {
    const map = new Map<string, User>();
    users.forEach((user) => map.set(user.id, user));
    return map;
  }, [users]);

  return (
    <main className={styles.page}>
      <article className={styles.card}>
        <div className={styles.cardHeader}>
          <h1 className={styles.title}>{post.title}</h1>
          <p className={styles.meta}>
            By{" "}
            {author ? <Link href={`/writer/${author.id}`}>{author.fullName}</Link> : "Unknown"} ·{" "}
            {new Date(post.createdAt).toLocaleDateString()}
          </p>
        </div>
        <p className={styles.excerpt}>{post.excerpt}</p>
        <pre className={styles.content}>{post.content}</pre>
        <div className={styles.reactions}>
          <button
            className={`${styles.buttonSecondary} ${liked ? styles.active : ""}`}
            type="button"
            onClick={toggleLove}
          >
            Love ({likes.length})
          </button>
          <div className={styles.reportStack}>
            <input
              className={styles.input}
              placeholder="Report reason"
              value={reportReason}
              onChange={(event) => setReportReason(event.target.value)}
            />
            <button className={styles.buttonSecondary} type="button" onClick={reportPost}>
              Report post
            </button>
          </div>
          {error ? <span className={styles.errorText}>{error}</span> : null}
        </div>
      </article>

      <section className={styles.card}>
        <h2 className={styles.sectionTitle}>Comments</h2>
        {viewer ? (
          <form className={styles.commentForm} onSubmit={addComment}>
            <textarea
              className={styles.textarea}
              rows={3}
              placeholder="Write a comment"
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              required
            />
            <button className={styles.button} type="submit">
              Post comment
            </button>
          </form>
        ) : (
          <p className={styles.muted}>Please log in to comment.</p>
        )}
        <div className={styles.commentList}>
          {comments.length === 0 ? (
            <p className={styles.muted}>No comments yet.</p>
          ) : (
            comments.map((comment) => {
              const commentAuthor = commentAuthors.get(comment.userId);
              const commentLiked = viewer ? comment.likes.includes(viewer.id) : false;
              return (
                <div key={comment.id} className={styles.comment}>
                  <div className={styles.commentBody}>
                    <strong>{commentAuthor?.fullName ?? "User"}</strong>
                    <p>{comment.content}</p>
                    <small>{new Date(comment.createdAt).toLocaleString()}</small>
                  </div>
                  <div className={styles.commentActions}>
                    <button
                      className={`${styles.buttonSecondary} ${commentLiked ? styles.active : ""}`}
                      type="button"
                      onClick={() => toggleCommentLove(comment.id)}
                    >
                      Love ({comment.likes.length})
                    </button>
                    <button
                      className={styles.buttonSecondary}
                      type="button"
                      onClick={() => reportComment(comment.id)}
                    >
                      Report
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className={styles.related}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Related blogs</h2>
          <span className={styles.badge}>{post.category}</span>
        </div>
        <div className={styles.grid}>
          {related.map((item) => (
            <div className={styles.card} key={item.id}>
              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>{item.title}</h3>
                <p className={styles.cardExcerpt}>{item.excerpt}</p>
              </div>
              <Link className={styles.buttonSecondary} href={`/post/${item.slug}`}>
                Read
              </Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
