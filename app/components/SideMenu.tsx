"use client";

import Link from "next/link";
import { ReactNode, useState } from "react";
import styles from "./sideMenu.module.css";

type SideMenuProps = {
  triggerIcon?: ReactNode;
};

export default function SideMenu({ triggerIcon }: SideMenuProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className={styles.menu}>
      <button
        className={styles.iconButton}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        {triggerIcon ?? "Menu"}
      </button>
      {open ? (
        <div className={styles.backdrop} onClick={() => setOpen(false)}>
          <aside
            className={styles.panel}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.header}>
              <strong>Writo</strong>
              <button
                className={styles.buttonSecondary}
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
              >
                Close
              </button>
            </div>
            <nav className={styles.links}>
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
