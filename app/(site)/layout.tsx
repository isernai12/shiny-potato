import { ReactNode } from "react";
import Link from "next/link";
import Header from "../components/Header";
import Tracker from "../components/Tracker";
import Maintenance from "../components/Maintenance";
import Suspended from "../components/Suspended";
import { cookies } from "next/headers";
import { getUserFromSessionId } from "../../lib/auth";
import { readSettings } from "../../lib/data/settings";
import { Github, Facebook, Twitter, Youtube } from "lucide-react";

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const cookieStore = cookies();
  const sessionId = cookieStore.get("writo_session")?.value;
  const user = await getUserFromSessionId(sessionId);
  const settings = await readSettings();

  const isSuspended = !!user?.suspended;
  const maintenanceBlocked = settings.maintenanceMode && user?.role !== "admin";
  const canShowChildren = !isSuspended && !maintenanceBlocked;

  const year = new Date().getFullYear();

  return (
    <div className="pageBlur">
      <Header />
      <Tracker />

      {isSuspended ? <Suspended /> : null}
      {!isSuspended && maintenanceBlocked ? <Maintenance /> : null}
      {canShowChildren ? children : null}

      <footer className="writoFooter">
        <div className="container writoFooterInner">
          <div>
            <div className="writoFooterBrand">Writo</div>
            <div className="writoFooterMeta">© {year} • All rights reserved</div>
          </div>

          <div className="writoFooterRight">
            <div className="writoFooterSocial" aria-label="Social links">
              {/* TODO: পরে href গুলো তোমার আসল লিংক দিয়ে রিপ্লেস করবে */}
              <a className="writoSocialBtn" href="#" target="_blank" rel="noreferrer" aria-label="GitHub">
                <Github />
              </a>
              <a className="writoSocialBtn" href="#" target="_blank" rel="noreferrer" aria-label="Facebook">
                <Facebook />
              </a>
              <a className="writoSocialBtn" href="#" target="_blank" rel="noreferrer" aria-label="X / Twitter">
                <Twitter />
              </a>
              <a className="writoSocialBtn" href="#" target="_blank" rel="noreferrer" aria-label="YouTube">
                <Youtube />
              </a>
            </div>

            <div className="writoFooterPolicy">
              {/* TODO: পরে /privacy এবং /terms পেজ বানালে ঠিকমতো কাজ করবে */}
              <Link className="writoFooterLink" href="/privacy">
                Privacy Policy
              </Link>
              <span className="writoFooterDot">•</span>
              <Link className="writoFooterLink" href="/terms">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
