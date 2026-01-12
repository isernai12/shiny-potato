import { NextResponse } from "next/server";
import { authenticate, sanitizeUser, signIn } from "../../../../lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.email || !body.password) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 });
    }
    const user = await authenticate(body.email, body.password);
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    const response = NextResponse.json({ user: sanitizeUser(user) });
    await signIn(response, user.id);
    return response;
  } catch (error) {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
