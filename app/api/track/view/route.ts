import { NextRequest, NextResponse } from "next/server";
import { readSiteStats, writeSiteStats } from "../../../../lib/data/stats";
import { randomUUID } from "crypto";

const VISITOR_COOKIE = "writo_visitor";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({ path: "/" }));
  const path = typeof body.path === "string" ? body.path : "/";

  const stats = await readSiteStats();
  stats.totalViews += 1;
  stats.last24hViews += 1;
  stats.topPage = path;
  stats.uptimeSeconds += 1;

  const visitor = request.cookies.get(VISITOR_COOKIE)?.value;
  const response = NextResponse.json({ ok: true });
  if (!visitor) {
    stats.uniqueVisitors += 1;
    response.cookies.set({ name: VISITOR_COOKIE, value: randomUUID(), path: "/" });
  }

  await writeSiteStats(stats);
  return response;
}
