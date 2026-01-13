"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function Tracker() {
  const pathname = usePathname();

  useEffect(() => {
    async function track() {
      await fetch("/api/track/view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: pathname || "/" })
      });
    }
    track();
  }, [pathname]);

  return null;
}
