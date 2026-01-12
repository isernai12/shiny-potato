import "../styles/globals.css";
import Link from "next/link";
import { ReactNode } from "react";

export const metadata = {
  title: "Writo",
  description: "A JSON-backed blog platform"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          <nav>
            <Link href="/">Writo</Link>
            <div className="links">
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/auth/login">Login</Link>
            </div>
          </nav>
        </div>
        {children}
      </body>
    </html>
  );
}
