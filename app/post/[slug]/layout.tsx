import { ReactNode } from "react";
import PostDetailLayout from "./PostDetailLayout";

export default function Layout({ children }: { children: ReactNode }) {
  return <PostDetailLayout>{children}</PostDetailLayout>;
}
