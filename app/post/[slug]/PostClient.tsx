"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

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

type Viewer = { id: string; fullName: string };

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
  const [reportReason, setReportReason] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // viewer
  useEffect(() => {
    async function load() {
      const response = await fetch("/api/me");
      if (!response.ok) return;
      const data = await response.json();
      setViewer(data.user ?? null);
    }
    load();
  }, []);

  // engagement time on unmount
  useEffect(() => {
    const started = Date.now();
    return () => {
      const seconds = Math.max(1, Math.round((Date.now() - started) / 1000));
      fetch("/api/track/engagement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id, seconds })
      }).catch(() => {});
    };
  }, [post.id]);

  // ✅ Header hide/show only on post detail
  useEffect(() => {
    if (!document.body.classList.contains("writoPostDetail")) return;

    let lastY = Math.max(0, window.scrollY || 0);
    let ticking = false;
    let compact = false;
    let lastToggle = 0;

    const COMPACT_ON = 90; // down scroll threshold
    const EXPAND_AT = 35; // near top
    const DELTA = 2;
    const COOLDOWN = 180;

    function setCompact(next: boolean) {
      const now = performance.now();
      if (next === compact) return;
      if (now - lastToggle < COOLDOWN) return;

      compact = next;
      document.body.classList.toggle("compactHeader", compact);
      lastToggle = now;
    }

    function onScrollSmart() {
      const y = Math.max(0, window.scrollY || 0);
      const d = y - lastY;

      if (y <= EXPAND_AT) {
        setCompact(false);
      } else {
        if (d > DELTA && y >= COMPACT_ON) setCompact(true);
        if (d < -DELTA) setCompact(false);
      }

      lastY = y;
      ticking = false;
    }

    function tick() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(onScrollSmart);
    }

    window.addEventListener("scroll", tick, { passive: true });
    return () => window.removeEventListener("scroll", tick);
  }, []);

  const commentAuthors = useMemo(() => {
    const map = new Map<string, User>();
    users.forEach((u) => map.set(u.id, u));
    return map;
  }, [users]);

  const liked = viewer ? likes.includes(viewer.id) : false;

  async function toggleLove() {
    setError("");
    setSuccess("");

    const response = await fetch(`/api/posts/${post.slug}/love`, { method: "POST" });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || "Failed to react");
      return;
    }
    const data = await response.json();
    setLikes(data.likes || []);
  }

  async function addComment(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const text = commentText.trim();
    if (!text) {
      setError("Write something first.");
      return;
    }

    const response = await fetch(`/api/posts/${post.slug}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text })
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || "Failed to comment");
      return;
    }

    const data = await response.json();
    setComments(data.comments || []);
    setCommentText("");
    setSuccess("Comment posted.");
  }

  async function toggleCommentLove(commentId: string) {
    setError("");
    setSuccess("");

    const response = await fetch(`/api/posts/${post.slug}/comments/${commentId}/love`, {
      method: "POST"
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || "Failed to react");
      return;
    }

    const data = await response.json();
    setComments(data.comments || []);
  }

  async function reportPost() {
    setError("");
    setSuccess("");

    const reason = reportReason.trim();
    if (!reason) {
      setError("Please enter a report reason.");
      return;
    }

    const response = await fetch("/api/reports/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: post.id, reason })
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || "Failed to report");
      return;
    }

    setReportReason("");
    setSuccess("Report submitted.");
  }

  async function reportComment(commentId: string) {
    setError("");
    setSuccess("");

    const reason = window.prompt("Report reason?");
    if (!reason) return;

    const response = await fetch("/api/reports/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: post.id, commentId, reason })
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || "Failed to report");
      return;
    }

    setSuccess("Comment report submitted.");
  }

  return (
    <main className="container stack" style={{ gap: 18 }}>
      {/* ✅ Track/TOC bar placeholder (if you already have Tracker component, keep it there)
          If your Tracker is a separate component rendered in layout, ignore this block.
          If you want this inside post page, give it className="postTrackerBar"
      */}
      {/* <div className="postTrackerBar"> ... </div> */}

      <section className="card stack" style={{ gap: 12 }}>
        <h1 style={{ fontSize: 26, lineHeight: 1.2 }}>{post.title}</h1>

        <div className="muted" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <span>
            By{" "}
            {author ? (
              <Link href={`/writer/${author.id}`} style={{ fontWeight: 700 }}>
                {author.fullName}
              </Link>
            ) : (
              "Unknown"
            )}
          </span>
          <span>•</span>
          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
          <span>•</span>
          <span>{post.category}</span>
        </div>

        {post.excerpt ? <p className="muted">{post.excerpt}</p> : null}

        <div className="stack" style={{ gap: 10 }}>
          <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", margin: 0 }}>
            {post.content}
          </pre>
        </div>

        <div className="stack" style={{ gap: 10 }}>
          <button
            className={`button secondary ${liked ? "active" : ""}`}
            type="button"
            onClick={toggleLove}
          >
            Love ({likes.length})
          </button>

          <div className="stack" style={{ gap: 8 }}>
            <input
              className="input"
              placeholder="Report reason"
              value={reportReason}
              onChange={(event) => setReportReason(event.target.value)}
            />
            <button className="button secondary" type="button" onClick={reportPost}>
              Report post
            </button>
          </div>

          {error ? <div className="notice error">{error}</div> : null}
          {success ? <div className="notice success">{success}</div> : null}
        </div>
      </section>

      <section className="card stack" style={{ gap: 12 }}>
        <h2>Comments</h2>

        {viewer ? (
          <form className="stack" style={{ gap: 10 }} onSubmit={addComment}>
            <textarea
              className="textarea"
              rows={3}
              placeholder="Write a comment"
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              required
            />
            <button className="button" type="submit">
              Post comment
            </button>
          </form>
        ) : (
          <p className="muted">
            Please <Link href="/auth/login">log in</Link> to comment.
          </p>
        )}

        <div className="stack" style={{ gap: 12 }}>
          {comments.length === 0 ? (
            <p className="muted">No comments yet.</p>
          ) : (
            comments.map((comment) => {
              const commentAuthor = commentAuthors.get(comment.userId);
              const commentLiked = viewer ? comment.likes.includes(viewer.id) : false;

              return (
                <div key={comment.id} className="comment card" style={{ padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div className="stack" style={{ gap: 6 }}>
                      <strong>{commentAuthor?.fullName ?? "User"}</strong>
                      <p style={{ margin: 0 }}>{comment.content}</p>
                      <small className="muted">
                        {new Date(comment.createdAt).toLocaleString()}
                      </small>
                    </div>

                    <div className="stack" style={{ gap: 8, alignItems: "flex-end" }}>
                      <button
                        className={`button secondary ${commentLiked ? "active" : ""}`}
                        type="button"
                        onClick={() => toggleCommentLove(comment.id)}
                      >
                        Love ({comment.likes.length})
                      </button>

                      <button
                        className="button secondary"
                        type="button"
                        onClick={() => reportComment(comment.id)}
                      >
                        Report
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      <section className="stack" style={{ gap: 12 }}>
        <div className="section-header" style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>Related blogs</h2>
          <span className="badge">{post.category}</span>
        </div>

        <div className="grid two">
          {related.map((item) => (
            <div className="card stack" key={item.id} style={{ gap: 10 }}>
              <h3 style={{ margin: 0 }}>{item.title}</h3>
              <p className="muted" style={{ margin: 0 }}>
                {item.excerpt}
              </p>
              <Link className="button secondary" href={`/post/${item.slug}`}>
                Read
              </Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
