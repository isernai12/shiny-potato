"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SideMenu from "./SideMenu";
import { BookmarkIcon, MenuIcon, MoonIcon, SearchIcon, SunIcon } from "./icons";

type BookmarkItem = {
  id: string;
  title: string;
  slug: string;
  thumbnailUrl?: string;
};

const BOOKMARK_KEY = "writo_bookmarks";

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
}

export default function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [bookmarkOpen, setBookmarkOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    setBookmarks(readBookmarks());
    const storedTheme = window.localStorage.getItem("writo_theme");
    if (storedTheme === "dark") {
      document.documentElement.classList.add("dark");
      setDarkMode(true);
    }

    function handleBookmarkUpdate(event: Event) {
      const custom = event as CustomEvent<BookmarkItem[]>;
      if (custom.detail) {
        setBookmarks(custom.detail);
        writeBookmarks(custom.detail);
      }
    }

    window.addEventListener("writo-bookmarks", handleBookmarkUpdate);
    return () => window.removeEventListener("writo-bookmarks", handleBookmarkUpdate);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const event = new CustomEvent("writo-search", { detail: query });
    window.dispatchEvent(event);
  }, [query]);

  function toggleTheme() {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.classList.add("dark");
      window.localStorage.setItem("writo_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      window.localStorage.setItem("writo_theme", "light");
    }
  }

  function removeBookmark(id: string) {
    const next = bookmarks.filter((item) => item.id !== id);
    setBookmarks(next);
    writeBookmarks(next);
  }

  return (
    <header className="header">
      <div className="container header__content">
        <div className="header__left">
          <SideMenu triggerIcon={<MenuIcon />} />
          <Link className="logo" href="/">
            Writo
          </Link>
        </div>
        <div className="header__right">
          <button
            className="icon-button"
            type="button"
            onClick={() => setSearchOpen((prev) => !prev)}
            aria-label="Search"
          >
            <SearchIcon />
          </button>
          <button
            className="icon-button"
            type="button"
            onClick={() => setBookmarkOpen((prev) => !prev)}
            aria-label="Bookmarks"
          >
            <BookmarkIcon />
          </button>
          <button
            className="icon-button"
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
          >
            {darkMode ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>
      </div>
      {searchOpen ? (
        <div className="search-bar">
          <div className="container">
            <input
              className="input"
              placeholder="Search posts..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>
      ) : null}
      {bookmarkOpen ? (
        <div className="bookmark-panel">
          <div className="container">
            <div className="card stack">
              <div className="header-row">
                <h3>Bookmarks</h3>
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => setBookmarkOpen(false)}
                >
                  Close
                </button>
              </div>
              {bookmarks.length === 0 ? (
                <p>No bookmarks yet.</p>
              ) : (
                <div className="stack">
                  {bookmarks.map((item) => (
                    <div className="bookmark-item" key={item.id}>
                      <Link href={`/post/${item.slug}`}>{item.title}</Link>
                      <button
                        className="button secondary"
                        type="button"
                        onClick={() => removeBookmark(item.id)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
