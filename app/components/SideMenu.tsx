"use client";

import Link from "next/link";
import { useState } from "react";

export default function SideMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="side-menu">
      <button
        className="button secondary"
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        Menu
      </button>
      {open ? (
        <div className="side-menu__backdrop" onClick={() => setOpen(false)}>
          <aside
            className="side-menu__panel"
            onClick={(event) => event.stopPropagation()}
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
      ) : null}
    </div>
  );
}
