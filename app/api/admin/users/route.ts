import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "../../../../lib/auth";
import { readUsers, setUserSuspended } from "../../../../lib/data/users";
import { sanitizeUser } from "../../../../lib/auth";
import { appendAuditEntry } from "../../../../lib/data/audit";

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ["admin"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const data = await readUsers();
  return NextResponse.json({ users: data.records.map(sanitizeUser) });
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ["admin"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  try {
    const body = await request.json();
    if (!body.userId || typeof body.suspended !== "boolean") {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    await setUserSuspended(body.userId, body.suspended);
    await appendAuditEntry({
      actorUserId: auth.user.id,
      action: body.suspended ? "user_suspend" : "user_unsuspend",
      target: body.userId
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Update failed" },
      { status: 400 }
    );
  }
}
