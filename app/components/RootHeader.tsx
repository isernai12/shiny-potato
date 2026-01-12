"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import Tracker from "./Tracker";

export default function RootHeader() {
  const pathname = usePathname();
  const hideHeader = pathname?.startsWith("/post/");

  if (hideHeader) return null;

  return (
    <>
      <Header />
      <Tracker />
    </>
  );
}
