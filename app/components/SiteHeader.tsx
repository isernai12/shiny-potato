"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";

export default function SiteHeader() {
  const pathname = usePathname();

  if (pathname?.startsWith("/post/")) {
    return null;
  }

  return <Header />;
}
