import "../styles/globals.css";
import { ReactNode } from "react";
import { Outfit } from "next/font/google";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "500", "700"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata = {
  title: "Writo",
  description: "A JSON-backed blog platform",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={outfit.variable} suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
