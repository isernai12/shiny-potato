import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireUser } from "../../../lib/auth";
import { updateUserProfile, findUserById } from "../../../lib/data/users";
import { sanitizeUser } from "../../../lib/auth";

export async function GET(request: NextRequest) {
  const auth = await requireUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  return NextResponse.json({ user: sanitizeUser(auth.user) });
}

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  try {
    const body = await request.json();
    const updates: {
      fullName?: string;
      avatarUrl?: string;
      bio?: string;
      passwordHash?: string;
    } = {};

    if (body.fullName) {
      updates.fullName = body.fullName;
    }
    if (typeof body.avatarUrl === "string") {
      updates.avatarUrl = body.avatarUrl || undefined;
    }
    if (typeof body.bio === "string") {
      updates.bio = body.bio;
    }
    if (body.password || body.confirmPassword) {
      if (body.password !== body.confirmPassword) {
        return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
      }
      if (body.password.length < 8) {
        return NextResponse.json({ error: "Password too short" }, { status: 400 });
      }
      updates.passwordHash = await bcrypt.hash(body.password, 10);
    }

    await updateUserProfile(auth.user.id, updates);
    const updated = await findUserById(auth.user.id);
    return NextResponse.json({ user: updated ? sanitizeUser(updated) : null });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Update failed" },
      { status: 400 }
    );
  }
}
