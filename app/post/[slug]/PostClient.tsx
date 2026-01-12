"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Bookmark,
  BookmarkCheck,
  BookOpen,
  Calendar,
  ChevronDown,
  Clock,
  Flag,
  Heart,
  Home,
  MessageCircle,
  Newspaper,
} from "lucide-react";
import styles from "./post.module.css";
import Header from "../../components/Header";

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
  thumbnailLatestUrl?: string;
  thumbnailTrendingUrl?: string;
};

type Viewer = {
  id: string;
  fullName: string;
};

type TocSection = {
  title: string;
  html: string;
  id: string;
};

type ParsedContent = {
  introHtml: string | null;
  sections: TocSection[];
};

type BookmarkItem = {
  id: string;
  title: string;
  slug: string;
  thumbnailUrl?: string;
};

const BOOKMARK_KEY = "writo_bookmarks";

function slugifyId(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function normalizeContent(raw: string) {
  const hasHtml = /<\/?[a-z][\s\S]*>/i.test(raw);
  if (hasHtml) {
    return raw;
  }
  return raw
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${block.replace(/\n/g, "<br />")}</p>`)
    .join("\n");
}

function parseContent(content: string): ParsedContent {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const marker = /^\s*type\s*:\s*(toc|into|intro)\s*<\s*(.+)\s*>\s*$/i;
  const sections: { title: string; html: string }[] = [];
  let current: { title: string; html: string } | null = null;
  let introHtml: string | null = null;
  let sawTocMarker = false;
  let prelude = "";

  const pushCurrent = () => {
    if (!current) return;
    const html = normalizeContent(current.html.trim());
    if (!html) return;
    sections.push({ title: current.title || "Section", html });
  };

  lines.forEach((line) => {
    const match = line.match(marker);
    if (match) {
      const type = match[1].toLowerCase();
      if (type === "into" || type === "intro") {
        introHtml = normalizeContent(match[2].trim());
        return;
      }
      sawTocMarker = true;
      if (prelude.trim()) {
        sections.push({ title: "Introduction", html: normalizeContent(prelude.trim()) });
        prelude = "";
      }
      pushCurrent();
      current = { title: match[2].trim() || "Section", html: "" };
      return;
    }
    if (current) {
      current.html += `${line}\n`;
    } else {
      prelude += `${line}\n`;
    }
  });

  pushCurrent();

  if (!sawTocMarker && content.trim() && sections.length === 0) {
    sections.push({ title: "Introduction", html: normalizeContent(content.trim()) });
  }

  const used = new Set<string>();
  const mapped = sections.map((section, index) => {
    let id = slugifyId(section.title) || "section";
    if (used.has(id)) {
      id = `${id}-${index + 1}`;
    }
    used.add(id);
    return { ...section, id };
  });

  if (prelude.trim()) {
    introHtml = introHtml ?? normalizeContent(prelude.trim());
  }

  return { introHtml, sections: mapped };
}

function readBookmarks(): BookmarkItem[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(BOOKMARK_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as BookmarkItem[];
  } catch {
    return [];
  }
}

function writeBookmarks(items: BookmarkItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(BOOKMARK_KEY, JSON.stringify(items));
}

export default function PostClient({
  post,
  author,
  related,
  users,
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
  const [reportOpen, setReportOpen] = useState(false);
  const [tocOpen, setTocOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [observerKey, setObserverKey] = useState(0);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const tocRef = useRef<HTMLDivElement | null>(null);
  const tocButtonRef = useRef<HTMLButtonElement | null>(null);
  const ringRef = useRef<SVGPathElement | null>(null);
  const trackerRef = useRef<HTMLDivElement | null>(null);

  const parsed = useMemo(() => parseContent(post.content || ""), [post.content]);

  const tocItems = useMemo(() => {
    const items = [...parsed.sections];
    items.push({ title: "Comments", html: "", id: "comments" });
    items.push({ title: "Related posts", html: "", id: "related-posts" });
    return items;
  }, [parsed.sections]);

  const trackedItems = useMemo(() => {
    const items: { title: string; id: string }[] = [];
    if (parsed.introHtml) {
      items.push({ title: "Introduction", id: "introduction" });
    }
    parsed.sections.forEach((section) => items.push({ title: section.title, id: section.id }));
    items.push({ title: "Comments", id: "comments" });
    items.push({ title: "Related posts", id: "related-posts" });
    return items;
  }, [parsed.introHtml, parsed.sections]);

  const readMinutes = useMemo(() => {
    const words = post.content ? post.content.trim().split(/\s+/).length : 0;
    return Math.max(1, Math.round(words / 200));
  }, [post.content]);

  const liked = viewer ? likes.includes(viewer.id) : false;

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
    const body = document.body;
    body.classList.add("postDetailPage");
    let lastY = Math.max(0, window.scrollY || 0);
    let ticking = false;
    let compact = false;
    let lastToggle = 0;
    const COMPACT_ON = 90;
    const EXPAND_AT = 35;
    const DELTA = 2;
    const COOLDOWN = 180;

    function updateStackHeight() {
      const header = document.querySelector<HTMLElement>(".writoHeader");
      const headerHeight = body.classList.contains("compactHeader")
        ? 0
        : Math.round(header?.getBoundingClientRect().height || 0);
      const trackerHeight = Math.round(trackerRef.current?.getBoundingClientRect().height || 0);
      const stack = Math.max(44, headerHeight + trackerHeight);
      document.documentElement.style.setProperty("--stackH", `${stack}px`);
    }

    function setCompact(next: boolean) {
      const now = performance.now();
      if (next === compact) return;
      if (now - lastToggle < COOLDOWN) return;
      compact = next;
      body.classList.toggle("compactHeader", compact);
      lastToggle = now;
      setObserverKey((value) => value + 1);
      updateStackHeight();
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
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
        updateStackHeight();
      });
    }

    updateStackHeight();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", updateStackHeight, { passive: true });
    return () => {
      body.classList.remove("postDetailPage", "compactHeader");
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", updateStackHeight);
    };
  }, []);

  useEffect(() => {
    const started = Date.now();
    return () => {
      const seconds = Math.max(1, Math.round((Date.now() - started) / 1000));
      fetch("/api/track/engagement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId: post.id, seconds }),
      });
    };
  }, [post.id]);

  useEffect(() => {
    const items = readBookmarks();
    setBookmarked(items.some((item) => item.id === post.id));
  }, [post.id]);

  useEffect(() => {
    function handleResize() {
      setObserverKey((value) => value + 1);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (!tocOpen) return;
    function handleClick(event: MouseEvent) {
      const target = event.target as Node;
      if (tocRef.current?.contains(target) || tocButtonRef.current?.contains(target)) {
        return;
      }
      setTocOpen(false);
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [tocOpen]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const nodes = Array.from(root.querySelectorAll<HTMLElement>("[data-track='true']"));
    if (!nodes.length) return;

    const header = document.querySelector<HTMLElement>(".writoHeader");
    const headerHeight = document.body.classList.contains("compactHeader")
      ? 0
      : Math.round(header?.getBoundingClientRect().height || 0);
    const trackerHeight = Math.round(trackerRef.current?.getBoundingClientRect().height || 0);
    const rootMargin = `-${headerHeight + trackerHeight + 24}px 0px -70% 0px`;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length) {
          const id = (visible[0].target as HTMLElement).id;
          const idx = trackedItems.findIndex((item) => item.id === id);
          if (idx >= 0) setActiveIndex(idx);
        } else if (window.scrollY <= 4) {
          setActiveIndex(0);
        }
      },
      { root: null, threshold: [0, 0.01, 0.1], rootMargin }
    );

    nodes.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [post.id, tocItems.length, observerKey, trackedItems]);

  useEffect(() => {
    let raf = 0;

    function updateProgress() {
      if (!ringRef.current) return;
      const doc = document.documentElement;
      const total = doc.scrollHeight - window.innerHeight;
      const progress = total <= 0 ? 1 : Math.min(1, Math.max(0, window.scrollY / total));
      ringRef.current.style.strokeDashoffset = String(100 - progress * 100);
    }

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
  }, [post.id]);

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
      body: JSON.stringify({ content: commentText }),
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
      method: "POST",
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
      body: JSON.stringify({ postId: post.id, reason: reportReason }),
    });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error || "Failed to report");
      return;
    }
    setReportReason("");
    setReportOpen(false);
  }

  async function reportComment(commentId: string) {
    const reason = window.prompt("Report reason?");
    if (!reason) return;
    const response = await fetch("/api/reports/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: post.id, commentId, reason }),
    });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error || "Failed to report");
    }
  }

  function toggleBookmark() {
    const items = readBookmarks();
    const exists = items.find((item) => item.id === post.id);
    let next: BookmarkItem[];
    if (exists) {
      next = items.filter((item) => item.id !== post.id);
      setBookmarked(false);
    } else {
      next = [
        ...items,
        {
          id: post.id,
          title: post.title,
          slug: post.slug,
          thumbnailUrl: post.thumbnailLatestUrl ?? post.thumbnailTrendingUrl,
        },
      ];
      setBookmarked(true);
    }
    writeBookmarks(next);
    window.dispatchEvent(new CustomEvent("writo-bookmarks", { detail: next }));
  }

  function scrollToSection(id: string) {
    const root = rootRef.current;
    if (!root) return;
    const section = root.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
    if (!section) return;
    const header = document.querySelector<HTMLElement>(".writoHeader");
    const headerHeight = document.body.classList.contains("compactHeader")
      ? 0
      : Math.round(header?.getBoundingClientRect().height || 0);
    const trackerHeight = Math.round(trackerRef.current?.getBoundingClientRect().height || 0);
    const offset = headerHeight + trackerHeight + 12;
    const top = window.scrollY + section.getBoundingClientRect().top - offset;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  }

  const commentAuthors = useMemo(() => {
    const map = new Map<string, User>();
    users.forEach((user) => map.set(user.id, user));
    return map;
  }, [users]);

  const heroImage =
    post.thumbnailLatestUrl ||
    post.thumbnailTrendingUrl ||
    "https://images.unsplash.com/photo-1526378722484-bd91ca387e72?auto=format&fit=crop&w=1200&q=80";

  return (
    <main className={styles.postPage} ref={rootRef}>
      <div className={styles.headerStack}>
        <Header />
        <div className={styles.trackerBar} ref={trackerRef}>
          <div className={styles.trackerInner}>
            <div className={styles.progressWrap} aria-label="Reading progress">
              <svg className={styles.progressSvg} viewBox="0 0 36 36" aria-hidden="true">
                <path className={styles.ringTrack} d="M18 2 a 16 16 0 0 1 0 32 a 16 16 0 0 1 0 -32" />
                <path
                  ref={ringRef}
                  className={styles.ringFill}
                  d="M18 2 a 16 16 0 0 1 0 32 a 16 16 0 0 1 0 -32"
                />
              </svg>
            </div>

            <div className={styles.trackerTitle}>
              <span>{trackedItems[activeIndex]?.title ?? "Introduction"}</span>
            </div>

            <button
              ref={tocButtonRef}
              className={styles.tocButton}
              type="button"
              data-open={tocOpen}
              aria-label="Open sections"
              onClick={() => setTocOpen((open) => !open)}
            >
              <ChevronDown className={styles.tocIcon} />
            </button>
          </div>
          <div ref={tocRef} className={styles.tocPanel} data-open={tocOpen}>
            <div className={styles.tocListWrap}>
              {tocItems.map((item) => (
                <div
                  key={item.id}
                  className={`${styles.tocItem} ${
                    trackedItems[activeIndex]?.id === item.id ? styles.tocItemActive : ""
                  }`}
                  onClick={() => {
                    scrollToSection(item.id);
                    setTocOpen(false);
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      scrollToSection(item.id);
                      setTocOpen(false);
                    }
                  }}
                >
                  {item.title}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className={styles.pageSection}>
        <div className={styles.breadcrumb} aria-label="Page location">
          <div className={`${styles.bLine} ${styles.bLineTop}`}>
            <span className={styles.bIcon}>
              <Home size={14} />
            </span>
            <span className={styles.metaDot}>/</span>
            <span className={styles.bIcon}>
              <Newspaper size={14} />
            </span>
            <span>{post.category}</span>
          </div>
          <div className={`${styles.bLine} ${styles.bLineSub}`}>
            <span className={styles.bIcon}>
              <BookOpen size={14} />
            </span>
            <strong>{post.title}</strong>
          </div>
        </div>

        <div className={styles.hero}>
          <div className={styles.thumb} aria-label="Thumbnail">
            <img src={heroImage} alt={post.title} loading="lazy" />
          </div>

          <div className={styles.metaRow}>
            <div className={styles.author}>
              <img
                className={styles.avatar}
                src={author?.avatarUrl || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=256&q=80"}
                alt={author?.fullName || "Author profile"}
                loading="lazy"
              />
              <div className={styles.authorText}>
                <div className={styles.authorName}>{author?.fullName || "Writo Editorial"}</div>
                <div className={styles.authorRole}>{author ? "Staff Writer" : "Guest Author"}</div>
              </div>
            </div>

            <div className={styles.metaRight} aria-label="Post details">
              <span>
                <Calendar size={14} /> {new Date(post.createdAt).toLocaleDateString()}
              </span>
              <span className={styles.metaDot}>•</span>
              <span>
                <Clock size={14} /> {readMinutes} min
              </span>
              <button
                className={styles.iconAction}
                type="button"
                aria-label="Report this post"
                title="Report"
                onClick={() => setReportOpen((open) => !open)}
              >
                <Flag size={16} />
              </button>
              <button
                className={`${styles.savePill} ${bookmarked ? styles.savePillActive : ""}`}
                type="button"
                aria-label={bookmarked ? "Saved" : "Save post"}
                data-on={bookmarked}
                onClick={toggleBookmark}
              >
                {bookmarked ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
                <span className={styles.saveLabel}>{bookmarked ? "Saved" : "Save"}</span>
              </button>
            </div>
          </div>

          {post.tags?.length ? (
            <div className={styles.tagRow}>
              {post.tags.map((tag) => (
                <span className={styles.tagPill} key={tag}>
                  #{tag}
                </span>
              ))}
            </div>
          ) : null}

          <div className={styles.actionRow}>
            <button
              className={`${styles.actionButton} ${liked ? styles.actionButtonActive : ""}`}
              type="button"
              onClick={toggleLove}
              aria-label="Love this post"
            >
              <Heart size={16} />
              <span className={styles.actionCount}>{likes.length}</span>
            </button>
            <div className={styles.actionButton} aria-hidden="true">
              <MessageCircle size={16} />
              <span className={styles.actionCount}>{comments.length}</span>
            </div>
          </div>

          {reportOpen ? (
            <div className={styles.reportPanel}>
              <textarea
                className={styles.reportInput}
                placeholder="Report reason"
                value={reportReason}
                onChange={(event) => setReportReason(event.target.value)}
              />
              <div className={styles.reportActions}>
                <button className={styles.ghostButton} type="button" onClick={() => setReportOpen(false)}>
                  Cancel
                </button>
                <button className={styles.primaryButton} type="button" onClick={reportPost}>
                  Report post
                </button>
              </div>
              {error ? <span className={styles.errorText}>{error}</span> : null}
            </div>
          ) : null}
        </div>

        <div className={styles.content}>
          {parsed.introHtml ? (
            <section
              id="introduction"
              data-track="true"
              data-title="Introduction"
              className={styles.intro}
            >
              <div
                className={styles.note}
                dangerouslySetInnerHTML={{ __html: parsed.introHtml }}
              />
            </section>
          ) : null}
          {parsed.sections.map((section) => (
            <section
              key={section.id}
              id={section.id}
              data-track="true"
              data-title={section.title}
              className={styles.section}
              dangerouslySetInnerHTML={{ __html: section.html }}
            />
          ))}
        </div>

        <section id="comments" data-track="true" data-title="Comments">
          <h2 className={styles.blockTitle}>Comments</h2>
          <div className={styles.commentComposer}>
            <div className={styles.composerRow}>
              <img
                className={styles.avatar}
                src={viewer?.id ? author?.avatarUrl || "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=256&q=80" : "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=256&q=80"}
                alt="Your profile"
                loading="lazy"
              />
              <div className={styles.composerMain}>
                <div className={styles.composerTop}>
                  <div className={styles.composerName}>{viewer?.fullName || "Guest"}</div>
                  <div className={styles.commentCount}>{comments.length} comments</div>
                </div>

                {viewer ? (
                  <form className={styles.composerForm} onSubmit={addComment}>
                    <textarea
                      className={styles.commentInput}
                      placeholder="Write a comment…"
                      value={commentText}
                      onChange={(event) => setCommentText(event.target.value)}
                      required
                    />
                    <div className={styles.composerBottom}>
                      <div className={styles.hintSmall}>Be respectful. Comments are public.</div>
                      <div className={styles.btnRow}>
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
                  </form>
                ) : (
                  <div className={styles.hintSmall}>Please log in to comment.</div>
                )}
              </div>
            </div>
          </div>
          {error ? <div className={styles.errorText}>{error}</div> : null}

          <div className={styles.commentList}>
            {comments.length === 0 ? (
              <div className={styles.emptyState}>No comments yet.</div>
            ) : (
              comments.map((comment) => {
                const commentAuthor = commentAuthors.get(comment.userId);
                const commentLiked = viewer ? comment.likes.includes(viewer.id) : false;
                return (
                  <div key={comment.id} className={styles.commentItem}>
                    <div className={styles.commentHead}>
                      <div className={styles.commentLeft}>
                        <img
                          className={styles.avatar}
                          src={commentAuthor?.avatarUrl || "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=160&q=80"}
                          alt={commentAuthor?.fullName || "User avatar"}
                          loading="lazy"
                        />
                        <div className={styles.commentName}>{commentAuthor?.fullName ?? "User"}</div>
                      </div>
                      <div className={styles.commentTime}>
                        {new Date(comment.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className={styles.commentBody}>{comment.content}</div>
                    <div className={styles.commentActions}>
                      <button
                        className={`${styles.actionButton} ${commentLiked ? styles.actionButtonActive : ""}`}
                        type="button"
                        onClick={() => toggleCommentLove(comment.id)}
                        aria-label="Love this comment"
                      >
                        <Heart size={16} />
                        <span className={styles.actionCount}>{comment.likes.length}</span>
                      </button>
                      <button
                        className={styles.actionButton}
                        type="button"
                        onClick={() => reportComment(comment.id)}
                      >
                        <Flag size={16} />
                        <span className={styles.actionCount}>Report</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section
          id="related-posts"
          data-track="true"
          data-title="Related posts"
          className={styles.relatedWrap}
        >
          <h2 className={styles.blockTitle}>Related Posts</h2>
          {related.length === 0 ? (
            <div className={styles.emptyState}>No related posts yet.</div>
          ) : (
            <div className={styles.relatedGrid} aria-label="Related posts grid">
              {related.map((item) => (
                <Link className={styles.relatedCard} key={item.id} href={`/post/${item.slug}`}>
                  <div className={styles.relImg}>
                    <img
                      src={
                        item.thumbnailLatestUrl ||
                        item.thumbnailTrendingUrl ||
                        "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80"
                      }
                      alt={item.title}
                      loading="lazy"
                    />
                  </div>
                  <div className={styles.relBody}>
                    <div className={styles.relTitle}>{item.title}</div>
                    <div className={styles.relMeta}>
                      <span>{Math.max(1, Math.round(item.content.split(/\s+/).length / 200))} min</span>
                      <span className={styles.relDot}>•</span>
                      <span>{item.category}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
