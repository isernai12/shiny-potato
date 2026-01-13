"use client";

import { useEffect, useMemo, useState } from "react";

export type TocItem = {
  id: string;
  title: string;
};

export default function TocTracker({
  items,
  activeId,
  onJump
}: {
  items: TocItem[];
  activeId?: string | null;
  onJump: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const activeTitle = useMemo(() => {
    const hit = items.find((x) => x.id === activeId);
    return hit?.title ?? (items[0]?.title ?? "On this page");
  }, [items, activeId]);

  // close on route-like scroll/resize
  useEffect(() => {
    function close() {
      setOpen(false);
    }
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, { passive: true });
    return () => {
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close);
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="postTrackerBar" role="navigation" aria-label="Table of contents">
      <div className="postTrackerInner">
        <button
          className="postTrackerBtn"
          type="button"
          onClick={() => setOpen((s) => !s)}
          aria-expanded={open}
        >
          <span className="postTrackerBtnTitle">{activeTitle}</span>
          <span className="postTrackerBtnChevron" aria-hidden="true">▾</span>
        </button>

        <div className={`postTrackerDropdown ${open ? "open" : ""}`}>
          {items.map((item) => (
            <button
              key={item.id}
              className={`postTrackerItem ${item.id === activeId ? "active" : ""}`}
              type="button"
              onClick={() => {
                onJump(item.id);
                setOpen(false);
              }}
            >
              {item.title}
            </button>
          ))}
        </div>

        {/* desktop pills */}
        <div className="postTrackerPills">
          {items.slice(0, 8).map((item) => (
            <button
              key={item.id}
              className={`postTrackerPill ${item.id === activeId ? "active" : ""}`}
              type="button"
              onClick={() => onJump(item.id)}
              title={item.title}
            >
              {item.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
