import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, sanitizeUser } from "../../../lib/auth";

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return NextResponse.json({ user: null }, { status: 200 });
  }
  return NextResponse.json({ user: sanitizeUser(user) });
}
