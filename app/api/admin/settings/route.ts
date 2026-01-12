import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "../../../../lib/auth";
import { readSettings, writeSettings } from "../../../../lib/data/settings";
import { appendAuditEntry } from "../../../../lib/data/audit";

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ["admin"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const settings = await readSettings();
  return NextResponse.json({ settings });
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ["admin"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  try {
    const body = await request.json();
    const settings = await readSettings();
    const updated = {
      ...settings,
      maintenanceMode: Boolean(body.maintenanceMode),
      enableRateLimits: Boolean(body.enableRateLimits),
      enableContentFilters: Boolean(body.enableContentFilters)
    };
    await writeSettings(updated);
    await appendAuditEntry({
      actorUserId: auth.user.id,
      action: "settings_update"
    });
    return NextResponse.json({ settings: updated });
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 400 });
  }
}
