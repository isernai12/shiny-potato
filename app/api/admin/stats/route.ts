import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "../../../../lib/auth";
import { readSiteStats } from "../../../../lib/data/stats";

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ["admin"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const stats = await readSiteStats();
  const uptimeSeconds = Math.floor(process.uptime());
  return NextResponse.json({ stats: { ...stats, uptimeSeconds } });
}
