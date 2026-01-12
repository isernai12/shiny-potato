"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Bookmark,
  Clock,
  Flame,
  Home,
  Languages,
  LayoutGrid,
  Menu,
  Moon,
  Search,
  Star,
  Sun,
  X,
  LogIn,
  User,
  LayoutDashboard,
  LogOut,
} from "lucide-react";

type BookmarkItem = {
  id: string;
  title: string;
  slug: string;
  thumbnailUrl?: string;
};

type MeUser = {
  id?: string;
  name?: string;
  fullName?: string;
  role?: "admin" | "writer" | "user" | string;
  suspended?: boolean;
};

const BOOKMARK_KEY = "writo_bookmarks";

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

type ModalName = "search" | "saved" | "translate" | null;

export default function Header() {
  const [mounted, setMounted] = useState(false);

  const [query, setQuery] = useState("");
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [darkMode, setDarkMode] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const [modal, setModal] = useState<ModalName>(null);

  const [me, setMe] = useState<MeUser | null>(null);
  const [meLoaded, setMeLoaded] = useState(false);

  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const overlayOpen = menuOpen || modal !== null;

  useEffect(() => {
    setMounted(true);

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

  // load current user (client-side)
  useEffect(() => {
    if (typeof window === "undefined") return;

    (async () => {
      try {
        const res = await fetch("/api/me", { cache: "no-store" });
        if (!res.ok) {
          setMe(null);
          setMeLoaded(true);
          return;
        }
        const data = await res.json();

        // Be tolerant to different shapes:
        // { user: {...} } or {...}
        const user: MeUser | null = (data?.user ?? data) || null;
        setMe(user && typeof user === "object" ? user : null);
      } catch {
        setMe(null);
      } finally {
        setMeLoaded(true);
      }
    })();
  }, []);

  // dispatch search query event (existing behavior)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const event = new CustomEvent("writo-search", { detail: query });
    window.dispatchEvent(event);
  }, [query]);

  // body classes for overlay/menu state
  useEffect(() => {
    if (!mounted) return;

    if (menuOpen) document.body.classList.add("menuOpen");
    else document.body.classList.remove("menuOpen");

    if (overlayOpen) document.body.classList.add("hasOverlay");
    else document.body.classList.remove("hasOverlay");
  }, [mounted, menuOpen, overlayOpen]);

  // ESC closes all
  useEffect(() => {
    if (!mounted) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeAll();
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, menuOpen, modal]);

  // focus search input on open (double rAF like your old layout)
  useEffect(() => {
    if (!mounted) return;
    if (modal !== "search") return;

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        try {
          searchInputRef.current?.focus({ preventScroll: true } as any);
        } catch {
          searchInputRef.current?.focus();
        }
      });
    });
  }, [mounted, modal]);

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

  function closeAll() {
    const ae = document.activeElement as HTMLElement | null;
    if (ae?.blur) ae.blur();

    requestAnimationFrame(() => {
      setMenuOpen(false);
      setModal(null);
    });
  }

  function openMenu() {
    setModal(null);
    setMenuOpen(true);
  }

  function openModal(next: Exclude<ModalName, null>) {
    setMenuOpen(false);
    setModal(next);
  }

  function removeBookmark(id: string) {
    const next = bookmarks.filter((item) => item.id !== id);
    setBookmarks(next);
    writeBookmarks(next);
  }

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore
    } finally {
      closeAll();
      window.location.href = "/";
    }
  }

  const isAuthed = !!me && !me?.suspended;
  const overlayMenuAndModals = useMemo(() => {
    if (!mounted) return null;

    return createPortal(
      <>
        <div className="writoOverlay" id="writoOverlay" onClick={closeAll} aria-hidden="true" />

        {/* Side Menu */}
        <aside className="writoMenu" id="writoMenu" aria-hidden={!menuOpen}>
          <div className="writoMenuHeader">
            <button
              className="writoIconBtn"
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
            >
              <X size={20} strokeWidth={1.5} />
            </button>
          </div>

          {/* Main nav */}
          <Link className="writoMenuItem" href="/" onClick={closeAll}>
            <Home size={20} strokeWidth={1.5} />
            <span>Home</span>
          </Link>

          <button className="writoMenuItem" type="button" disabled aria-disabled="true">
            <LayoutGrid size={20} strokeWidth={1.5} />
            <span>Categories</span>
          </button>

          <Link className="writoMenuItem" href="/posts" onClick={closeAll}>
            <Clock size={20} strokeWidth={1.5} />
            <span>Latest</span>
          </Link>

          <button className="writoMenuItem" type="button" disabled aria-disabled="true">
            <Flame size={20} strokeWidth={1.5} />
            <span>Trending</span>
          </button>

          <button className="writoMenuItem" type="button" disabled aria-disabled="true">
            <Star size={20} strokeWidth={1.5} />
            <span>Featured</span>
          </button>

          {/* Account section */}
          {meLoaded ? (
            <>
              {!isAuthed ? (
                <>
                  <Link className="writoMenuItem" href="/auth/login" onClick={closeAll}>
                    <LogIn size={20} strokeWidth={1.5} />
                    <span>Login</span>
                  </Link>

                  <Link className="writoMenuItem" href="/auth/register" onClick={closeAll}>
                    <User size={20} strokeWidth={1.5} />
                    <span>Sign up</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link className="writoMenuItem" href="/profile" onClick={closeAll}>
                    <User size={20} strokeWidth={1.5} />
                    <span>Profile</span>
                  </Link>

                  <Link className="writoMenuItem" href="/dashboard" onClick={closeAll}>
                    <LayoutDashboard size={20} strokeWidth={1.5} />
                    <span>Dashboard</span>
                  </Link>

                  <button className="writoMenuItem" type="button" onClick={handleLogout}>
                    <LogOut size={20} strokeWidth={1.5} />
                    <span>Logout</span>
                  </button>
                </>
              )}
            </>
          ) : null}
        </aside>

        {/* Search Modal */}
        <section
          className={`writoModal ${modal === "search" ? "open" : ""}`}
          id="writoModalSearch"
          aria-hidden={modal !== "search"}
        >
          <div className="writoModalInner">
            <div className="writoModalHead">
              <div className="writoModalTitle">
                <Search size={20} strokeWidth={1.5} /> Search
              </div>
              <button className="writoModalClose" type="button" onClick={closeAll} aria-label="Close">
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            <input
              ref={searchInputRef}
              className="writoSearchInput"
              type="search"
              placeholder="Type to search…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            <div className="writoHint">ইউজার এখানে লিখতে পারবে (ডেমো)। এখন সার্চ কাজ করবে না।</div>
          </div>
        </section>

        {/* Translate Modal (UI only) */}
        <section
          className={`writoModal ${modal === "translate" ? "open" : ""}`}
          id="writoModalTranslate"
          aria-hidden={modal !== "translate"}
        >
          <div className="writoModalInner">
            <div className="writoModalHead">
              <div className="writoModalTitle">
                <Languages size={20} strokeWidth={1.5} /> Translate
              </div>
              <button className="writoModalClose" type="button" onClick={closeAll} aria-label="Close">
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            <div className="writoPillGrid">
              <div className="writoLangPill">বাংলা</div>
              <div className="writoLangPill">English</div>
              <div className="writoLangPill">हिन्दी</div>
              <div className="writoLangPill">اردو</div>
              <div className="writoLangPill">العربية</div>
            </div>

            <div className="writoHint">ভাষা সিলেক্ট UI থাকবে, কিন্তু এখন কাজ করবে না।</div>
          </div>
        </section>

        {/* Saved / Bookmarks Modal */}
        <section
          className={`writoModal ${modal === "saved" ? "open" : ""}`}
          id="writoModalSaved"
          aria-hidden={modal !== "saved"}
        >
          <div className="writoModalInner">
            <div className="writoModalHead">
              <div className="writoModalTitle">
                <Bookmark size={20} strokeWidth={1.5} /> Saved
              </div>
              <button className="writoModalClose" type="button" onClick={closeAll} aria-label="Close">
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>

            {bookmarks.length === 0 ? (
              <div className="writoEmpty">
                এখনো কোনো পোস্ট সেভ করা হয়নি। (ডেমো) <br />
                পরে এখানে সেভ করা পোস্টগুলো দেখাবে — আপাতত কাজ করবে না।
              </div>
            ) : (
              <div className="writoSavedList">
                {bookmarks.map((item) => (
                  <div className="writoSavedItem" key={item.id}>
                    <Link href={`/post/${item.slug}`} onClick={closeAll}>
                      {item.title}
                    </Link>

                    <div className="writoSavedActions">
                      <button
                        className="writoIconBtn"
                        type="button"
                        onClick={() => removeBookmark(item.id)}
                        aria-label="Remove"
                      >
                        <X size={20} strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </>,
      document.body
    );
  }, [mounted, menuOpen, modal, query, bookmarks, meLoaded, isAuthed]);

  return (
    <>
      <header className="writoHeader">
        <div className="writoHeaderLeft">
          <button className="writoIconBtn" type="button" onClick={openMenu} aria-label="Open menu">
            <Menu size={20} strokeWidth={1.5} />
          </button>

          <Link className="writoBrand" href="/">
            Writo
          </Link>
        </div>

        <div className="writoHeaderRight">
          <button className="writoIconBtn" type="button" onClick={() => openModal("search")} aria-label="Search">
            <Search size={20} strokeWidth={1.5} />
          </button>

          <button className="writoIconBtn" type="button" onClick={() => openModal("saved")} aria-label="Bookmarks">
            <Bookmark size={20} strokeWidth={1.5} />
          </button>

          <button className="writoIconBtn" type="button" onClick={() => openModal("translate")} aria-label="Translate">
            <Languages size={20} strokeWidth={1.5} />
          </button>

          <button className="writoIconBtn" type="button" onClick={toggleTheme} aria-label="Toggle theme">
            {darkMode ? <Sun size={20} strokeWidth={1.5} /> : <Moon size={20} strokeWidth={1.5} />}
          </button>
        </div>
      </header>

      {overlayMenuAndModals}
    </>
  );
}
