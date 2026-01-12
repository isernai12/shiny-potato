import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "../../../../lib/auth";
import { createUser, readUsers } from "../../../../lib/data/users";
import { sanitizeUser } from "../../../../lib/auth";

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
    if (!body.email || !body.password || !body.name || !body.role) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    const user = await createUser({
      email: body.email,
      password: body.password,
      name: body.name,
      role: body.role
    });
    return NextResponse.json({ user: sanitizeUser(user) }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Create failed" },
      { status: 400 }
    );
  }
}
