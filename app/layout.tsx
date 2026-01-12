import "../styles/globals.css";
import { ReactNode } from "react";
import Header from "./components/Header";

export const metadata = {
  title: "Writo",
  description: "A JSON-backed blog platform"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
