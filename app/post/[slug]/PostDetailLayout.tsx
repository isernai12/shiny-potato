"use client";

import { ReactNode, useEffect } from "react";

const TRACKER_SELECTOR = "[data-post-tracker='true']";

export default function PostDetailLayout({ children }: { children: ReactNode }) {
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

    function getTrackerHeight() {
      const tracker = document.querySelector<HTMLElement>(TRACKER_SELECTOR);
      return Math.round(tracker?.getBoundingClientRect().height || 0);
    }

    function updateStackHeight() {
      const header = document.querySelector<HTMLElement>(".writoHeader");
      const headerHeight = body.classList.contains("compactHeader")
        ? 0
        : Math.round(header?.getBoundingClientRect().height || 0);
      const trackerHeight = getTrackerHeight();
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

  return <>{children}</>;
}
