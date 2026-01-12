"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./home.module.css";
import {
  ArrowRight,
  Bookmark as BookmarkIcon,
  BookmarkCheck,
  Clock,
  Link2,
  MessageCircle
} from "lucide-react";

type User = {
  id: string;
  fullName: string;
  avatarUrl?: string;
};

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  tags: string[];
  category: string;
  authorUserId: string;
  createdAt: string;
  thumbnailLatestUrl?: string;
  thumbnailTrendingUrl?: string;
  engagementTotalSeconds?: number;
  engagementCount?: number;
  comments?: any[]; // data layer has comments: Comment[]
};

type BookmarkItem = {
  id: string;
  title: string;
  slug: string;
  thumbnailUrl?: string;
};

const BOOKMARK_KEY = "writo_bookmarks";

function useSearchQuery() {
  const [query, setQuery] = useState("");

  useEffect(() => {
    function handleSearch(event: Event) {
      const custom = event as CustomEvent<string>;
      setQuery(custom.detail || "");
    }

    window.addEventListener("writo-search", handleSearch);
    return () => window.removeEventListener("writo-search", handleSearch);
  }, []);

  return query;
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
  const event = new CustomEvent("writo-bookmarks", { detail: items });
  window.dispatchEvent(event);
}

function getAuthor(users: User[], userId: string) {
  return users.find((u) => u.id === userId);
}

function pickThumbnail(post: Post, variant: "trending" | "latest") {
  if (variant === "trending") return post.thumbnailTrendingUrl || post.thumbnailLatestUrl || undefined;
  return post.thumbnailLatestUrl || post.thumbnailTrendingUrl || undefined;
}

function formatDateShort(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function estimateReadMinutes(post: Post) {
  // prefer engagement avg seconds if present
  const count = post.engagementCount ?? 0;
  const total = post.engagementTotalSeconds ?? 0;
  if (count > 0 && total > 0) {
    const avg = total / count; // seconds
    const mins = Math.max(1, Math.round(avg / 60));
    return `${mins} min`;
  }

  // fallback by excerpt words ~ 200 wpm
  const words = (post.excerpt || "").trim().split(/\s+/).filter(Boolean).length;
  const mins = Math.max(1, Math.round(words / 40)); // excerpt-only, so lower divisor to look realistic
  return `${mins} min`;
}

function LatestCard({
  post,
  author,
  onToggleBookmark,
  bookmarked
}: {
  post: Post;
  author?: User;
  onToggleBookmark: (post: Post) => void;
  bookmarked: boolean;
}) {
  const thumb = pickThumbnail(post, "latest");
  const tags = Array.isArray(post.tags) ? post.tags : [];
  const badgeA = tags[0] || "Latest";
  const badgeB = post.category || tags[1] || "Writo";
  const commentCount = Array.isArray(post.comments) ? post.comments.length : 0;

  return (
    <article className={styles.latestCard}>
      <Link href={`/post/${post.slug}`} className={styles.cardLink} aria-label={post.title}>
        <div className={`${styles.thumb} ${styles.imgBox}`}>
          {thumb ? <img loading="lazy" src={thumb} alt={post.title} /> : null}
        </div>
      </Link>

      <div className={styles.content}>
        <div className={styles.badgeRow}>
          <span className={styles.badge}>{badgeA}</span>
          <span className={styles.badge}>{badgeB}</span>
        </div>

        <Link href={`/post/${post.slug}`} className={styles.titleLink}>
          <h3 className={styles.title}>{post.title}</h3>
        </Link>

        <p className={styles.excerpt}>{post.excerpt}</p>

        <div className={styles.metaRow}>
          <div className={styles.metaLeft}>
            <Link
              href={author ? `/writer/${author.id}` : "#"}
              className={styles.authorLinkWrap}
              aria-disabled={!author}
              onClick={(e) => {
                if (!author) e.preventDefault();
              }}
            >
              <div className={`${styles.avatar} ${styles.imgBox}`}>
                {author?.avatarUrl ? (
                  <img loading="lazy" src={author.avatarUrl} alt={author.fullName} />
                ) : (
                  <div className={styles.avatarFallback}>{author?.fullName?.charAt(0) ?? "W"}</div>
                )}
              </div>

              <div className={styles.authorMeta}>
                <div className={styles.author}>{author?.fullName ?? "Unknown"}</div>
                <div className={styles.subMeta}>
                  <span>{formatDateShort(post.createdAt)}</span>
                  <span className={styles.dotMini} />
                  <span>{estimateReadMinutes(post)}</span>
                </div>
              </div>
            </Link>
          </div>

          <div className={styles.metaRight}>
            <div className={styles.comments} title="Comments">
              <MessageCircle size={14} />
              <span>{commentCount}</span>
            </div>

            <button
              className={styles.bookmarkBtn}
              type="button"
              onClick={() => onToggleBookmark(post)}
              aria-label={bookmarked ? "Remove bookmark" : "Bookmark"}
              title={bookmarked ? "Saved" : "Save"}
            >
              {bookmarked ? <BookmarkCheck size={16} /> : <BookmarkIcon size={16} />}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function MiniCard({
  post,
  author
}: {
  post: Post;
  author?: User;
}) {
  const thumb = pickThumbnail(post, "latest");
  const commentCount = Array.isArray(post.comments) ? post.comments.length : 0;

  return (
    <article className={styles.postMini}>
      <Link href={`/post/${post.slug}`} className={styles.miniLink}>
        <div className={`${styles.miniThumb} ${styles.imgBox}`}>
          {thumb ? <img loading="lazy" src={thumb} alt={post.title} /> : null}
        </div>

        <div className={styles.miniBody}>
          <div className={styles.miniTitle}>{post.title}</div>
          <div className={styles.miniDesc}>{post.excerpt}</div>

          <div className={styles.miniMeta}>
            <div className={styles.miniLeft}>
              <div className={`${styles.miniAvatar} ${styles.imgBox}`}>
                {author?.avatarUrl ? (
                  <img loading="lazy" src={author.avatarUrl} alt={author.fullName} />
                ) : (
                  <div className={styles.avatarFallbackSmall}>{author?.fullName?.charAt(0) ?? "W"}</div>
                )}
              </div>

              <div className={styles.miniAuthorMeta}>
                <div className={styles.miniAuthor}>{author?.fullName ?? "Unknown"}</div>
                <div className={styles.sub}>
                  <span>{estimateReadMinutes(post)}</span>
                  <span className={styles.miniDot} />
                  <span>{formatDateShort(post.createdAt)}</span>
                </div>
              </div>
            </div>

            <div className={styles.miniRight} title="Comments">
              <MessageCircle size={14} />
              <span>{commentCount}</span>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}

export default function HomeClient({ posts, users }: { posts: Post[]; users: User[] }) {
  const query = useSearchQuery();
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const didInit = useRef(false);

  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    setBookmarks(readBookmarks());
  }, []);

  const approvedPosts = useMemo(() => posts ?? [], [posts]);

  const trendingPosts = useMemo(
    () => [...approvedPosts].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4),
    [approvedPosts]
  );

  const hero = trendingPosts[0];

  const latestPosts = useMemo(
    () => [...approvedPosts].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
    [approvedPosts]
  );

  const topCategories = useMemo(() => {
    const counts = new Map<string, number>();
    approvedPosts.forEach((p) => counts.set(p.category, (counts.get(p.category) || 0) + 1));
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([c]) => c);
  }, [approvedPosts]);

  const categoryPosts = useMemo(() => {
    return topCategories.map((category) => ({
      category,
      posts: approvedPosts.filter((p) => p.category === category).slice(0, 8)
    }));
  }, [approvedPosts, topCategories]);

  const topWriters = useMemo(() => {
    const counts = new Map<string, number>();
    approvedPosts.forEach((p) => counts.set(p.authorUserId, (counts.get(p.authorUserId) || 0) + 1));
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([userId]) => users.find((u) => u.id === userId))
      .filter(Boolean) as User[];
  }, [approvedPosts, users]);

  const searchResults = useMemo(() => {
    if (!query) return [];
    const lower = query.toLowerCase();
    return approvedPosts.filter(
      (p) =>
        p.title.toLowerCase().includes(lower) ||
        p.excerpt.toLowerCase().includes(lower) ||
        (p.tags || []).some((t) => t.toLowerCase().includes(lower)) ||
        (p.category || "").toLowerCase().includes(lower)
    );
  }, [approvedPosts, query]);

  function isBookmarked(postId: string) {
    return bookmarks.some((b) => b.id === postId);
  }

  function toggleBookmark(post: Post) {
    const exists = bookmarks.find((b) => b.id === post.id);
    if (exists) {
      const next = bookmarks.filter((b) => b.id !== post.id);
      setBookmarks(next);
      writeBookmarks(next);
      return;
    }
    const next = [
      ...bookmarks,
      { id: post.id, title: post.title, slug: post.slug, thumbnailUrl: post.thumbnailLatestUrl }
    ];
    setBookmarks(next);
    writeBookmarks(next);
  }

  return (
    <div className={styles.contentWrap}>
      {/* Trending hero */}
      {hero ? (
        <section className={styles.trendWrap}>
          <div className={styles.carousel}>
            <img
              className={styles.heroImg}
              src={pickThumbnail(hero, "trending") || pickThumbnail(hero, "latest") || ""}
              alt={hero.title}
            />
            <div className={styles.overlay} />

            <div className={styles.slideTitle}>{hero.title}</div>

            <Link
              className={styles.linkIcon}
              href={`/post/${hero.slug}`}
              title="Open link"
              aria-label="Open link"
            >
              <Link2 size={14} />
            </Link>

            <div className={styles.dots} aria-hidden="true">
              {trendingPosts.map((p, idx) => (
                <div
                  key={p.id}
                  className={`${styles.dot} ${idx === 0 ? styles.dotActive : ""}`}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <main className={styles.main}>
        {/* Search Results */}
        {query ? (
          <>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitleHead}>
                <Clock size={16} />
                Search Results
              </h2>

              <div className={styles.viewAllLink} aria-hidden="true">
                {searchResults.length} found
              </div>
            </div>

            <section className={styles.latestList}>
              {searchResults.length === 0 ? (
                <div className={styles.emptyText}>No posts found.</div>
              ) : (
                searchResults.map((post) => (
                  <LatestCard
                    key={post.id}
                    post={post}
                    author={getAuthor(users, post.authorUserId)}
                    onToggleBookmark={toggleBookmark}
                    bookmarked={isBookmarked(post.id)}
                  />
                ))
              )}
            </section>
          </>
        ) : null}

        {/* Latest */}
        {!query ? (
          <>
            <div className={styles.sectionHead}>
              <h2 className={styles.sectionTitleHead}>
                <Clock size={16} />
                Latest
              </h2>

              <Link className={styles.viewAllLink} href="/posts">
                View all
                <ArrowRight size={14} />
              </Link>
            </div>

            <section className={styles.latestList}>
              {latestPosts.map((post) => (
                <LatestCard
                  key={post.id}
                  post={post}
                  author={getAuthor(users, post.authorUserId)}
                  onToggleBookmark={toggleBookmark}
                  bookmarked={isBookmarked(post.id)}
                />
              ))}
            </section>

            {/* Posts You May Love */}
            {categoryPosts.length > 0 ? (
              <section className={styles.loveSection}>
                <div className={styles.sectionTitle}>Posts You May Love</div>

                {categoryPosts.map((group) => (
                  <section key={group.category} className={styles.catBlock}>
                    <div className={styles.catHeader}>
                      <div className={styles.catName}>
                        <span>{group.category}</span>
                        <span className={styles.catPill}>Top</span>
                      </div>

                      <Link className={styles.catMore} href="/posts">
                        View all
                      </Link>
                    </div>

                    <div className={styles.postRow}>
                      {group.posts.map((post) => (
                        <MiniCard
                          key={post.id}
                          post={post}
                          author={getAuthor(users, post.authorUserId)}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </section>
            ) : null}

            {/* Top Writers */}
            {topWriters.length > 0 ? (
              <section className={styles.topWriters}>
                <div className={styles.writersHeader}>
                  <div className={styles.writersTitle}>Top Writers</div>
                  <Link className={styles.writersViewAll} href="/posts">
                    View all
                  </Link>
                </div>

                <div className={styles.writerRow}>
                  {topWriters.map((u) => (
                    <Link key={u.id} href={`/writer/${u.id}`} className={`${styles.writer} ${styles.imgBox}`} aria-label={u.fullName}>
                      {u.avatarUrl ? (
                        <img loading="lazy" src={u.avatarUrl} alt={u.fullName} />
                      ) : (
                        <div className={styles.writerFallback}>{u.fullName?.charAt(0) ?? "W"}</div>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            ) : null}
          </>
        ) : null}
      </main>
    </div>
  );
}
