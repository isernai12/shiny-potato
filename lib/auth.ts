import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createSession, deleteSession, findSession } from "./data/sessions";
import { findUserByEmail, findUserById } from "./data/users";
import { Role, User } from "./types";

const COOKIE_NAME = "writo_session";

export function sanitizeUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
    role: user.role,
    createdAt: user.createdAt
  };
}

export async function authenticate(email: string, password: string) {
  const user = await findUserByEmail(email);
  if (!user) return undefined;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return undefined;
  return user;
}

export async function signIn(response: NextResponse, userId: string) {
  const session = await createSession(userId);
  response.cookies.set({
    name: COOKIE_NAME,
    value: session.id,
    httpOnly: true,
    path: "/",
    sameSite: "lax"
  });
  return session;
}

export function signOut(response: NextResponse) {
  response.cookies.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: 0
  });
}

export async function getSessionUser(request: NextRequest) {
  const cookie = request.cookies.get(COOKIE_NAME);
  if (!cookie?.value) return undefined;
  const session = await findSession(cookie.value);
  if (!session) return undefined;
  const user = await findUserById(session.userId);
  if (!user) {
    await deleteSession(session.id);
  }
  return user;
}

export async function requireUser(request: NextRequest) {
  const user = await getSessionUser(request);
  if (!user) {
    return { error: "Unauthorized", status: 401 };
  }
  return { user };
}

export async function requireRole(request: NextRequest, roles: Role[]) {
  const result = await requireUser(request);
  if ("error" in result) return result;
  if (!roles.includes(result.user.role)) {
    return { error: "Forbidden", status: 403 };
  }
  return result;
}
