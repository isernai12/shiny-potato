import { NextRequest, NextResponse } from "next/server";
import { deleteSession } from "../../../../lib/data/sessions";
import { signOut } from "../../../../lib/auth";

export async function POST(request: NextRequest) {
  const sessionId = request.cookies.get("writo_session")?.value;
  if (sessionId) {
    await deleteSession(sessionId);
  }
  const response = NextResponse.json({ ok: true });
  signOut(response);
  return response;
}
