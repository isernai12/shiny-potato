import "../styles/globals.css";
import { ReactNode } from "react";
import Header from "./components/Header";
import Tracker from "./components/Tracker";
import Maintenance from "./components/Maintenance";
import Suspended from "./components/Suspended";
import { cookies } from "next/headers";
import { getUserFromSessionId } from "../lib/auth";
import { readSettings } from "../lib/data/settings";

export const metadata = {
  title: "Writo",
  description: "A JSON-backed blog platform"
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const cookieStore = cookies();
  const sessionId = cookieStore.get("writo_session")?.value;
  const user = await getUserFromSessionId(sessionId);
  const settings = await readSettings();

  return (
    <html lang="en">
      <body>
        <Header />
        <Tracker />
        {user?.suspended ? <Suspended /> : null}
        {!user?.suspended && settings.maintenanceMode && user?.role !== "admin" ? (
          <Maintenance />
        ) : null}
        {!user?.suspended && !(settings.maintenanceMode && user?.role !== "admin") ? children : null}
      </body>
    </html>
  );
}
