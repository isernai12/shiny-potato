import "../styles/globals.css";
import { ReactNode } from "react";
import Header from "./components/Header";
import Tracker from "./components/Tracker";

export const metadata = {
  title: "Writo",
  description: "A JSON-backed blog platform"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <Tracker />
        {children}
      </body>
    </html>
  );
}
