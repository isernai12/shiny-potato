import { NextResponse } from "next/server";
import { createUser } from "../../../../lib/data/users";
import { sanitizeUser, signIn } from "../../../../lib/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.email || !body.password || !body.name) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    if (body.password.length < 8) {
      return NextResponse.json({ error: "Password too short" }, { status: 400 });
    }
    const user = await createUser({
      email: body.email,
      password: body.password,
      name: body.name
    });
    const response = NextResponse.json({ user: sanitizeUser(user) });
    await signIn(response, user.id);
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Registration failed" },
      { status: 400 }
    );
  }
}
