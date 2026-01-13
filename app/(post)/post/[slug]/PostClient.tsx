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
    <main className="container stack">
      <article className="card stack">
        <h1>{post.title}</h1>
        <p>
          By{" "}
          {author ? <Link href={`/writer/${author.id}`}>{author.fullName}</Link> : "Unknown"} ·{" "}
          {new Date(post.createdAt).toLocaleDateString()}
        </p>
        <p>{post.excerpt}</p>
        <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit" }}>{post.content}</pre>
        <div className="post-reactions">
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
          {error ? <span className="error-text">{error}</span> : null}
        </div>
      </article>

      <section className="card stack">
        <h2>Comments</h2>
        {viewer ? (
          <form className="stack" onSubmit={addComment}>
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
          <p>Please log in to comment.</p>
        )}
        <div className="stack">
          {comments.length === 0 ? (
            <p>No comments yet.</p>
          ) : (
            comments.map((comment) => {
              const commentAuthor = commentAuthors.get(comment.userId);
              const commentLiked = viewer ? comment.likes.includes(viewer.id) : false;
              return (
                <div key={comment.id} className="comment">
                  <div>
                    <strong>{commentAuthor?.fullName ?? "User"}</strong>
                    <p>{comment.content}</p>
                    <small>{new Date(comment.createdAt).toLocaleString()}</small>
                  </div>
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
              );
            })
          )}
        </div>
      </section>

      <section className="stack">
        <div className="section-header">
          <h2>Related blogs</h2>
          <span className="badge">{post.category}</span>
        </div>
        <div className="grid two">
          {related.map((item) => (
            <div className="card stack" key={item.id}>
              <h3>{item.title}</h3>
              <p>{item.excerpt}</p>
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
