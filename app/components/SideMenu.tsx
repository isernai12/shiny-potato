"use client";

import Link from "next/link";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

type SideMenuProps = {
  triggerIcon?: ReactNode;
};

export default function SideMenu({ triggerIcon }: SideMenuProps) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // open হলে body scroll বন্ধ + Esc চাপলে close
  useEffect(() => {
    if (!mounted) return;

    document.body.style.overflow = open ? "hidden" : "";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, mounted]);

  const overlay = useMemo(() => {
    if (!open) return null;

    return (
      <div className="side-menu__backdrop" onClick={() => setOpen(false)}>
        <aside
          className="side-menu__panel open"
          onClick={(e) => e.stopPropagation()}
          aria-label="Side menu"
        >
          <div className="side-menu__header">
            <strong>Writo</strong>
            <button
              className="button secondary"
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              Close
            </button>
          </div>

          <nav className="side-menu__links">
            <Link href="/" onClick={() => setOpen(false)}>
              Home
            </Link>
            <Link href="/dashboard" onClick={() => setOpen(false)}>
              Dashboard
            </Link>
            <Link href="/profile" onClick={() => setOpen(false)}>
              Profile
            </Link>
            <Link href="/auth/login" onClick={() => setOpen(false)}>
              Login
            </Link>
            <Link href="/auth/register" onClick={() => setOpen(false)}>
              Sign up
            </Link>
          </nav>
        </aside>
      </div>
    );
  }, [open]);

  return (
    <div className="side-menu">
      <button
        className="icon-button"
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        {triggerIcon ?? "Menu"}
      </button>

      {/* Portal: overlay always on top of full page */}
      {mounted && overlay ? createPortal(overlay, document.body) : null}
    </div>
  );
}
