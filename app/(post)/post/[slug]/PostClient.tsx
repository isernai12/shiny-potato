"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import styles from "./post-detail.module.css";

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
  thumbnailLatestUrl?: string;
  thumbnailTrendingUrl?: string;
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

type TocItem = {
  id: string;
  title: string;
};

const TOC_MARKER = /^\s*type\s*:\s*toc\s*<\s*([^>]+?)\s*>\s*$/i;
const READ_TIME_WORDS = 200;

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function toHtmlBlock(raw: string) {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/<[a-z][\s\S]*>/i.test(trimmed)) {
    return trimmed;
  }
  const escaped = escapeHtml(trimmed);
  const paragraphs = escaped
    .split(/\n{2,}/)
    .map((chunk) => chunk.replace(/\n/g, "<br />"));
  return `<p>${paragraphs.join("</p><p>")}</p>`;
}

function slugifyId(value: string) {
  const base = value
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return base || "section";
}

function parseTocSections(content: string) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const sections: { title: string; html: string }[] = [];
  let current = { title: "Introduction", html: "" };
  let sawMarker = false;

  const pushCurrent = () => {
    const html = toHtmlBlock(current.html);
    if (html) {
      sections.push({ title: current.title, html });
    }
  };

  for (const line of lines) {
    const match = line.match(TOC_MARKER);
    if (match) {
      sawMarker = true;
      pushCurrent();
      current = { title: match[1].trim() || "Section", html: "" };
      continue;
    }
    current.html += `${line}\n`;
  }
  pushCurrent();

  if (!sawMarker && content.trim()) {
    return [
      {
        title: "Introduction",
        html: toHtmlBlock(content)
      }
    ];
  }

  return sections;
}

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
  const [tocOpen, setTocOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [saved, setSaved] = useState(false);
  const [tocItems, setTocItems] = useState<TocItem[]>([]);

  const tocRootRef = useRef<HTMLDivElement | null>(null);
  const ringRef = useRef<SVGPathElement | null>(null);
  const trackerRef = useRef<HTMLDivElement | null>(null);

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

  async function reportPost(reason: string) {
    if (!reason) return;
    const response = await fetch("/api/reports/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: post.id, reason })
    });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error || "Failed to report");
      return;
    }
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

  const sections = useMemo(() => {
    const parsed = parseTocSections(post.content || "");
    const ids = new Set<string>();
    return parsed.map((section, index) => {
      let id = slugifyId(section.title);
      if (ids.has(id)) {
        id = `${id}-${index + 1}`;
      }
      ids.add(id);
      return { ...section, id };
    });
  }, [post.content]);

  const readingTime = useMemo(() => {
    const words = post.content.split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / READ_TIME_WORDS));
  }, [post.content]);

  useEffect(() => {
    const root = tocRootRef.current;
    if (!root) return;
    const sectionsInDom = Array.from(root.querySelectorAll<HTMLElement>("[data-track='true']"));
    if (!sectionsInDom.length) return;

    setTocItems(
      sectionsInDom.map((section) => ({
        id: section.id,
        title: section.dataset.title || "Section"
      }))
    );

    const updateActive = (entries: IntersectionObserverEntry[]) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible.length === 0) return;
      const index = sectionsInDom.findIndex((item) => item === visible[0].target);
      if (index >= 0) {
        setActiveSection(index);
      }
    };

    const observer = new IntersectionObserver(updateActive, {
      root: null,
      threshold: [0, 0.1, 0.25],
      rootMargin: "-35% 0px -55% 0px"
    });

    sectionsInDom.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [sections, comments.length]);

  useEffect(() => {
    function updateProgress() {
      if (!ringRef.current) return;
      const doc = document.documentElement;
      const total = doc.scrollHeight - window.innerHeight;
      const progress = total <= 0 ? 1 : Math.min(1, Math.max(0, window.scrollY / total));
      ringRef.current.style.strokeDashoffset = String(100 - progress * 100);
    }

    let raf = 0;
    function onScroll() {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        updateProgress();
        raf = 0;
      });
    }

    updateProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateProgress);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateProgress);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    let lastScroll = window.scrollY;
    let ticking = false;
    let compact = false;
    let lastToggle = 0;

    const COMPACT_ON = 90;
    const EXPAND_AT = 35;
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

    function onScroll() {
      const y = Math.max(0, window.scrollY);
      const delta = y - lastScroll;

      if (y <= EXPAND_AT) {
        setCompact(false);
      } else {
        if (delta > DELTA && y >= COMPACT_ON) setCompact(true);
        if (delta < -DELTA) setCompact(false);
      }

      lastScroll = y;
      ticking = false;
    }

    function tick() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(onScroll);
    }

    window.addEventListener("scroll", tick, { passive: true });
    return () => {
      window.removeEventListener("scroll", tick);
      document.body.classList.remove("compactHeader");
    };
  }, []);

  const currentTitle = tocItems[activeSection]?.title || "Introduction";
  const heroImage =
    post.thumbnailTrendingUrl ||
    post.thumbnailLatestUrl ||
    "https://images.unsplash.com/photo-1526378722484-bd91ca387e72?auto=format&fit=crop&w=1200&q=80";

  return (
    <div className={styles.postDetail} ref={tocRootRef}>
      <div className={styles.headerStack} ref={trackerRef}>
        <div className={styles.trackerBar}>
          <div className={styles.trackerInner}>
            <div className={styles.progressWrap} aria-label="Reading progress">
              <svg className={styles.progressSvg} viewBox="0 0 36 36" aria-hidden="true">
                <path
                  className={styles.ringTrack}
                  d="M18 2 a 16 16 0 0 1 0 32 a 16 16 0 0 1 0 -32"
                />
                <path
                  ref={ringRef}
                  className={styles.ringFill}
                  d="M18 2 a 16 16 0 0 1 0 32 a 16 16 0 0 1 0 -32"
                />
              </svg>
            </div>

            <div className={styles.trackerTitle}>
              <span>{currentTitle}</span>
            </div>

            <button
              className={styles.tocButton}
              type="button"
              data-open={tocOpen}
              onClick={() => setTocOpen((prev) => !prev)}
              aria-label="Open sections"
            >
              <span className={styles.chevron} aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className={`${styles.toc} ${tocOpen ? styles.tocOpen : ""}`}>
          <div className={styles.tocList}>
            {tocItems.map((item, index) => (
              <button
                key={item.id}
                className={`${styles.tocItem} ${index === activeSection ? styles.tocItemActive : ""}`}
                type="button"
                onClick={() => {
                  const el = document.getElementById(item.id);
                  if (!el) return;
                  const headerOffset = trackerRef.current?.getBoundingClientRect().height ?? 0;
                  const top = window.scrollY + el.getBoundingClientRect().top - headerOffset - 12;
                  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
                  setTocOpen(false);
                }}
              >
                {item.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.pageSection}>
        <div className={styles.breadcrumbRow} aria-label="Page location">
          <div className={styles.breadcrumbTop}>
            <span className={styles.crumb}>Home</span>
            <span className={styles.separator}>•</span>
            <span className={styles.crumb}>{post.category}</span>
          </div>
          <div className={styles.breadcrumbTitle}>{post.title}</div>
        </div>

        <div className={styles.hero}>
          <div className={styles.thumbnail} aria-label="Thumbnail">
            <img src={heroImage} alt={`${post.title} thumbnail`} loading="lazy" />
          </div>

          <div className={styles.metaRow}>
            <div className={styles.author}>
              <div className={styles.avatar}>
                {author?.avatarUrl ? (
                  <img src={author.avatarUrl} alt={author.fullName} />
                ) : (
                  <span>{author?.fullName?.slice(0, 1) || "W"}</span>
                )}
              </div>
              <div className={styles.authorText}>
                <div className={styles.authorName}>
                  {author ? <Link href={`/writer/${author.id}`}>{author.fullName}</Link> : "Unknown"}
                </div>
                <div className={styles.authorRole}>Staff Writer</div>
              </div>
            </div>

            <div className={styles.metaRight} aria-label="Post details">
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
              <span className={styles.metaDot}>•</span>
              <span>{readingTime} min</span>
              <button
                className={styles.iconAction}
                type="button"
                onClick={toggleLove}
                aria-pressed={liked}
                aria-label="Love this post"
                title="Love"
              >
                ♥ <span className={styles.loveCountSmall}>{likes.length}</span>
              </button>
              <button
                className={styles.iconAction}
                type="button"
                onClick={() => {
                  const reason = window.prompt("Report reason?");
                  if (!reason) return;
                  reportPost(reason);
                }}
                aria-label="Report this post"
                title="Report"
              >
                ⚑
              </button>
              <button
                className={styles.savePill}
                type="button"
                data-on={saved}
                onClick={() => setSaved((prev) => !prev)}
                aria-label="Save post"
              >
                <span className={styles.saveIcon}>{saved ? "★" : "☆"}</span>
                <span className={styles.saveLabel}>{saved ? "Saved" : "Save"}</span>
              </button>
            </div>
          </div>
        </div>

        <main className={styles.content}>
          {sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              data-track="true"
              data-title={section.title}
              className={styles.contentSection}
              dangerouslySetInnerHTML={{ __html: section.html }}
            />
          ))}
        </main>

        <section
          id="comments"
          data-track="true"
          data-title="Comments"
          className={styles.comments}
        >
          <h2 className={styles.blockTitle}>Comments</h2>
          {viewer ? (
            <form className={styles.commentComposer} onSubmit={addComment}>
              <div className={styles.composerRow}>
                <div className={styles.avatarSmall}>
                  <span>{viewer.fullName?.slice(0, 1) || "U"}</span>
                </div>
                <div className={styles.composerMain}>
                  <div className={styles.composerTop}>
                    <div className={styles.composerName}>{viewer.fullName}</div>
                    <div className={styles.commentCount}>{comments.length} comments</div>
                  </div>
                  <textarea
                    className={styles.commentInput}
                    placeholder="Write a comment…"
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value)}
                    required
                  />
                  <div className={styles.composerBottom}>
                    <div className={styles.hintSmall}>Be respectful. Comments are public.</div>
                    <div className={styles.buttonRow}>
                      <button
                        className={styles.ghostButton}
                        type="button"
                        onClick={() => setCommentText("")}
                      >
                        Clear
                      </button>
                      <button className={styles.primaryButton} type="submit">
                        Post Comment
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <p className={styles.mutedText}>Please log in to comment.</p>
          )}

          <div className={styles.commentList}>
            {comments.length === 0 ? (
              <p className={styles.mutedText}>No comments yet.</p>
            ) : (
              comments.map((comment) => {
                const commentAuthor = commentAuthors.get(comment.userId);
                const commentLiked = viewer ? comment.likes.includes(viewer.id) : false;
                return (
                  <div key={comment.id} className={styles.commentItem}>
                    <div className={styles.commentHead}>
                      <div className={styles.commentLeft}>
                        <div className={styles.avatarTiny}>
                          <span>{commentAuthor?.fullName?.slice(0, 1) || "U"}</span>
                        </div>
                        <div className={styles.commentName}>{commentAuthor?.fullName ?? "User"}</div>
                      </div>
                      <div className={styles.commentTime}>
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className={styles.commentBody}>{comment.content}</div>
                    <div className={styles.commentActions}>
                      <button
                        className={styles.miniIconButton}
                        type="button"
                        data-on={commentLiked}
                        onClick={() => toggleCommentLove(comment.id)}
                      >
                        <span>♥</span>
                        <span className={styles.loveCount}>{comment.likes.length}</span>
                      </button>
                      <button
                        className={styles.miniIconButton}
                        type="button"
                        onClick={() => reportComment(comment.id)}
                      >
                        ⚑
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {error ? <span className={styles.errorText}>{error}</span> : null}
        </section>

        <section
          id="related-posts"
          data-track="true"
          data-title="Related Posts"
          className={styles.relatedWrap}
        >
          <h2 className={styles.blockTitle}>Related Posts</h2>
          <div className={styles.relatedGrid} aria-label="Related posts grid">
            {related.map((item) => (
              <Link className={styles.relatedCard} href={`/post/${item.slug}`} key={item.id}>
                <div className={styles.relatedImage}>
                  <img
                    src={
                      item.thumbnailTrendingUrl ||
                      item.thumbnailLatestUrl ||
                      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80"
                    }
                    alt={`${item.title} thumbnail`}
                    loading="lazy"
                  />
                </div>
                <div className={styles.relatedBody}>
                  <div className={styles.relatedTitle}>{item.title}</div>
                  <div className={styles.relatedMeta}>
                    <span>{Math.max(1, Math.ceil(item.content.split(/\s+/).length / READ_TIME_WORDS))} min</span>
                    <span className={styles.metaDot}>•</span>
                    <span>{item.category}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
