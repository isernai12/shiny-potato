import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "../../../../../../lib/auth";

export async function POST(request: NextRequest, context: { params: { id: string } }) {
  const auth = await requireRole(request, ["admin"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  return NextResponse.json({ error: "Writer requests are disabled." }, { status: 400 });
}
