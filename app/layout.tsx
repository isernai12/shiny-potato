import "../styles/globals.css";
import { ReactNode } from "react";
import Header from "./components/Header";
import Tracker from "./components/Tracker";
import Maintenance from "./components/Maintenance";
import Suspended from "./components/Suspended";
import { cookies } from "next/headers";
import { getUserFromSessionId } from "../lib/auth";
import { readSettings } from "../lib/data/settings";
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

export default async function RootLayout({ children }: { children: ReactNode }) {
  const cookieStore = cookies();
  const sessionId = cookieStore.get("writo_session")?.value;
  const user = await getUserFromSessionId(sessionId);
  const settings = await readSettings();

  const isSuspended = !!user?.suspended;
  const maintenanceBlocked = settings.maintenanceMode && user?.role !== "admin";
  const canShowChildren = !isSuspended && !maintenanceBlocked;

  return (
    <html lang="en" className={outfit.variable}>
      <body>
        <div className="pageBlur">
          <Header />
          <Tracker />
          {isSuspended ? <Suspended /> : null}
          {!isSuspended && maintenanceBlocked ? <Maintenance /> : null}
          {canShowChildren ? children : null}
        </div>
      </body>
    </html>
  );
}
