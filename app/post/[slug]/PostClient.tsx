"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import TocTracker, { TocItem } from "./TocTracker";
import { parseTocFromContent } from "./tocParser";

type User = { id: string; fullName: string; avatarUrl?: string };
type Comment = { id: string; userId: string; content: string; createdAt: string; likes: string[] };
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
  const [error, setError] = useState("");
  const [reportReason, setReportReason] = useState("");

  const [activeId, setActiveId] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  // ✅ Only post detail page: body class + hide main header on scroll
  useEffect(() => {
    document.body.classList.add("writoPostDetail");
    let lastY = window.scrollY;
    let ticking = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;

      window.requestAnimationFrame(() => {
        const y = window.scrollY;
        const goingDown = y > lastY;
        const delta = Math.abs(y - lastY);

        // when scroll down a bit, hide main header; when scroll up, show it
        if (y > 120 && goingDown && delta > 6) {
          document.body.classList.add("compactHeader");
        }
        if (!goingDown && delta > 6) {
          document.body.classList.remove("compactHeader");
        }

        lastY = y;
        ticking = false;
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      document.body.classList.remove("writoPostDetail");
      document.body.classList.remove("compactHeader");
    };
  }, []);

  // viewer load
  useEffect(() => {
    async function load() {
      const response = await fetch("/api/me");
      if (!response.ok) return;
      const data = await response.json();
      setViewer(data.user ?? null);
    }
    load();
  }, []);

  // engagement tracker (existing feature)
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

  // ✅ Parse TOC markers into html + items
  const parsed = useMemo(() => parseTocFromContent(post.content || ""), [post.content]);
  const tocItems: TocItem[] = parsed.items;

  // ✅ Observe headings to set active section
  useEffect(() => {
    if (!tocItems.length) return;

    const root = null;
    const els = tocItems
      .map((x) => document.getElementById(x.id))
      .filter(Boolean) as HTMLElement[];

    if (!els.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        // pick the most visible intersecting entry near top
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0))[0];

        if (visible?.target?.id) {
          setActiveId(visible.target.id);
        }
      },
      {
        root,
        rootMargin: "-35% 0px -55% 0px",
        threshold: [0.1, 0.25, 0.5, 0.75]
      }
    );

    els.forEach((el) => io.observe(el));

    // set first by default
    setActiveId((prev) => prev ?? tocItems[0].id);

    return () => io.disconnect();
  }, [tocItems]);

  function jumpTo(id: string) {
    const el = document.getElementById(id);
    if (!el) return;

    // keep tracker + sticky header in mind
    const headerOffset = document.body.classList.contains("compactHeader") ? 56 : 56 + 54;
    const top = el.getBoundingClientRect().top + window.scrollY - headerOffset - 10;

    window.scrollTo({ top, behavior: "smooth" });
  }

  return (
    <>
      {/* ✅ This is your NEW TOC/Track header (not the old Tracker.tsx) */}
      <TocTracker items={tocItems} activeId={activeId} onJump={jumpTo} />

      <main className="container stack">
        <div className="stack" style={{ gap: 10 }}>
          <h1 style={{ fontSize: 28, letterSpacing: -0.6 }}>{post.title}</h1>

          <div className="muted" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span>
              By{" "}
              {author ? <Link href={`/writer/${author.id}`}>{author.fullName}</Link> : "Unknown"}
            </span>
            <span>·</span>
            <span>{new Date(post.createdAt).toLocaleDateString()}</span>
            <span>·</span>
            <span className="badge">{post.category}</span>
          </div>

          {post.excerpt ? <p className="muted">{post.excerpt}</p> : null}

          <div className="row" style={{ gap: 10, flexWrap: "wrap" }}>
            <button
              className={`button secondary ${liked ? "active" : ""}`}
              type="button"
              onClick={toggleLove}
            >
              Love ({likes.length})
            </button>

            <div className="row" style={{ flex: 1, minWidth: 220, gap: 8 }}>
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
          </div>

          {error ? <div className="notice error">{error}</div> : null}
        </div>

        {/* ✅ Render post content with auto headings */}
        <article
          ref={contentRef}
          className="postBody card"
          dangerouslySetInnerHTML={{ __html: parsed.html }}
        />

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
            <p className="muted">Please log in to comment.</p>
          )}

          <div className="stack">
            {comments.length === 0 ? (
              <p className="muted">No comments yet.</p>
            ) : (
              comments.map((comment) => {
                const commentAuthor = commentAuthors.get(comment.userId);
                const commentLiked = viewer ? comment.likes.includes(viewer.id) : false;

                return (
                  <div key={comment.id} className="comment card" style={{ boxShadow: "none" }}>
                    <div className="stack" style={{ gap: 6 }}>
                      <strong>{commentAuthor?.fullName ?? "User"}</strong>
                      <p>{comment.content}</p>
                      <small className="muted">{new Date(comment.createdAt).toLocaleString()}</small>
                    </div>

                    <div className="row" style={{ marginTop: 10, flexWrap: "wrap" }}>
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
                <p className="muted">{item.excerpt}</p>
                <Link className="button secondary" href={`/post/${item.slug}`}>
                  Read
                </Link>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
