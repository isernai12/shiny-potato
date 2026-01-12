import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "../../../../lib/auth";
import { readUsers } from "../../../../lib/data/users";
import { sanitizeUser } from "../../../../lib/auth";

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ["admin"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const data = await readUsers();
  return NextResponse.json({ users: data.records.map(sanitizeUser) });
}
