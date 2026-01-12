"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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
  } catch (error) {
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
  return users.find((user) => user.id === userId);
}

function pickThumbnail(post: Post, variant: "trending" | "latest") {
  if (variant === "trending") {
    return post.thumbnailTrendingUrl || undefined;
  }
  return post.thumbnailLatestUrl || undefined;
}

function PostCard({
  post,
  author,
  variant,
  onToggleBookmark,
  isBookmarked
}: {
  post: Post;
  author?: User;
  variant: "trending" | "latest" | "category";
  onToggleBookmark: (post: Post) => void;
  isBookmarked: boolean;
}) {
  const thumbnail =
    variant === "trending"
      ? pickThumbnail(post, "trending")
      : pickThumbnail(post, "latest");

  return (
    <article className="blog-card">
      <div className="blog-card__thumb">
        {thumbnail ? <img src={thumbnail} alt={post.title} /> : <div className="thumb-fallback" />}
      </div>
      <div className="blog-card__content">
        <div className="blog-card__meta">
          <div className="author">
            {author?.avatarUrl ? (
              <img className="author__avatar" src={author.avatarUrl} alt={author.fullName} />
            ) : (
              <div className="author__avatar author__avatar--placeholder">
                {author?.fullName?.charAt(0) ?? "W"}
              </div>
            )}
            <div>
              <p className="author__name">{author?.fullName ?? "Unknown"}</p>
              <p className="author__date">{new Date(post.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          {author ? (
            <Link className="author__link" href={`/writer/${author.id}`}>
              View profile
            </Link>
          ) : null}
          <button
            className={`bookmark-toggle ${isBookmarked ? "active" : ""}`}
            type="button"
            onClick={() => onToggleBookmark(post)}
            aria-label="Toggle bookmark"
          >
            {isBookmarked ? "★" : "☆"}
          </button>
        </div>
        <h3>{post.title}</h3>
        <p>{post.excerpt}</p>
        <div className="blog-card__footer">
          <span className="badge">{post.tags.join(", ") || "No tags"}</span>
          <Link className="button secondary" href={`/post/${post.slug}`}>
            Read
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function HomeClient({ posts, users }: { posts: Post[]; users: User[] }) {
  const query = useSearchQuery();
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);

  useEffect(() => {
    setBookmarks(readBookmarks());
  }, []);

  const approvedPosts = useMemo(() => posts, [posts]);

  const trendingPosts = useMemo(
    () => [...approvedPosts].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 3),
    [approvedPosts]
  );

  const latestPosts = useMemo(
    () => [...approvedPosts].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6),
    [approvedPosts]
  );

  const topTags = useMemo(() => {
    const counts = new Map<string, number>();
    approvedPosts.forEach((post) => {
      counts.set(post.category, (counts.get(post.category) || 0) + 1);
    });
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([category]) => category);
  }, [approvedPosts]);

  const categoryPosts = useMemo(
    () =>
      topTags.map((category) => ({
        category,
        posts: approvedPosts.filter((post) => post.category === category).slice(0, 3)
      })),
    [approvedPosts, topTags]
  );

  const topWriters = useMemo(() => {
    const counts = new Map<string, number>();
    approvedPosts.forEach((post) => {
      counts.set(post.authorUserId, (counts.get(post.authorUserId) || 0) + 1);
    });
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([userId, count]) => ({
        user: users.find((user) => user.id === userId),
        count
      }))
      .filter((entry) => entry.user);
  }, [approvedPosts, users]);

  const searchResults = useMemo(() => {
    if (!query) return [];
    const lower = query.toLowerCase();
    return approvedPosts.filter(
      (post) =>
        post.title.toLowerCase().includes(lower) ||
        post.excerpt.toLowerCase().includes(lower) ||
        post.tags.some((tag) => tag.toLowerCase().includes(lower)) ||
        post.category.toLowerCase().includes(lower)
    );
  }, [approvedPosts, query]);

  function isBookmarked(postId: string) {
    return bookmarks.some((item) => item.id === postId);
  }

  function toggleBookmark(post: Post) {
    const exists = bookmarks.find((item) => item.id === post.id);
    if (exists) {
      const next = bookmarks.filter((item) => item.id !== post.id);
      setBookmarks(next);
      writeBookmarks(next);
      return;
    }
    const next = [
      ...bookmarks,
      {
        id: post.id,
        title: post.title,
        slug: post.slug,
        thumbnailUrl: post.thumbnailLatestUrl
      }
    ];
    setBookmarks(next);
    writeBookmarks(next);
  }

  return (
    <main className="container stack">
      {query ? (
        <section className="stack">
          <h2>Search Results</h2>
          {searchResults.length === 0 ? (
            <p>No posts found.</p>
          ) : (
            <div className="stack">
              {searchResults.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  author={getAuthor(users, post.authorUserId)}
                  variant="latest"
                  onToggleBookmark={toggleBookmark}
                  isBookmarked={isBookmarked(post.id)}
                />
              ))}
            </div>
          )}
        </section>
      ) : null}

      <section className="stack">
        <div className="section-header">
          <h2>Trending Posts</h2>
          <span className="badge">Top picks</span>
        </div>
        <div className="grid two">
          {trendingPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              author={getAuthor(users, post.authorUserId)}
              variant="trending"
              onToggleBookmark={toggleBookmark}
              isBookmarked={isBookmarked(post.id)}
            />
          ))}
        </div>
      </section>

      <section className="stack">
        <div className="section-header">
          <h2>Latest Posts</h2>
          <span className="badge">Fresh</span>
        </div>
        <div className="grid two">
          {latestPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              author={getAuthor(users, post.authorUserId)}
              variant="latest"
              onToggleBookmark={toggleBookmark}
              isBookmarked={isBookmarked(post.id)}
            />
          ))}
        </div>
      </section>

      {categoryPosts.length > 0 ? (
        <section className="stack">
          <div className="section-header">
            <h2>Category Picks</h2>
            <span className="badge">Top tags</span>
          </div>
        <div className="grid two">
          {categoryPosts.map((group) => (
            <div key={group.category} className="card stack">
              <h3>{group.category}</h3>
              {group.posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                    author={getAuthor(users, post.authorUserId)}
                    variant="category"
                    onToggleBookmark={toggleBookmark}
                    isBookmarked={isBookmarked(post.id)}
                  />
                ))}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="stack">
        <div className="section-header">
          <h2>Top Writers</h2>
          <span className="badge">Community</span>
        </div>
        <div className="grid two">
          {topWriters.map((writer) => (
            <div className="card writer-card" key={writer.user?.id}>
              <Link className="writer-card__link" href={`/writer/${writer.user?.id}`}>
                {writer.user?.avatarUrl ? (
                  <img src={writer.user.avatarUrl} alt={writer.user.fullName} />
                ) : (
                  <div className="writer-card__avatar">
                    {writer.user?.fullName?.charAt(0) ?? "W"}
                  </div>
                )}
                <div>
                  <h4>{writer.user?.fullName}</h4>
                  <p>{writer.count} posts</p>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </section>

      <footer className="footer">
        <div>
          <strong>Writo</strong>
          <p>Built for writers and readers.</p>
        </div>
        <div className="footer__links">
          <Link href="/">Home</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/profile">Profile</Link>
          <Link href="/auth/register">Sign up</Link>
        </div>
      </footer>
    </main>
  );
}
