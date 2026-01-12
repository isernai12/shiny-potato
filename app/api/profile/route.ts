import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { requireUser, sanitizeUser } from "../../../lib/auth";
import { updateUserProfile, findUserById } from "../../../lib/data/users";
import { SocialLinks } from "../../../lib/types";

function cleanString(value: unknown) {
  if (typeof value !== "string") return undefined;
  const v = value.trim();
  return v ? v : undefined;
}

function limit3(list: unknown) {
  if (!Array.isArray(list)) return undefined;
  return list.filter((x) => typeof x === "string").slice(0, 3) as string[];
}

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
      socials?: SocialLinks;
      hobbies?: string[];
      categories?: string[];
    } = {};

    if (body.fullName) {
      updates.fullName = String(body.fullName);
    }

    if (typeof body.avatarUrl === "string") {
      updates.avatarUrl = body.avatarUrl.trim() || undefined;
    }

    if (typeof body.bio === "string") {
      updates.bio = body.bio;
    }

    // ✅ socials
    if (body.socials && typeof body.socials === "object") {
      const s = body.socials as Record<string, unknown>;
      updates.socials = {
        facebook: cleanString(s.facebook),
        x: cleanString(s.x),
        instagram: cleanString(s.instagram),
        youtube: cleanString(s.youtube),
        github: cleanString(s.github),
        website: cleanString(s.website)
      };
    }

    // ✅ hobbies/categories (max 3)
    const hobbies = limit3(body.hobbies);
    if (hobbies) updates.hobbies = hobbies;

    const categories = limit3(body.categories);
    if (categories) updates.categories = categories;

    // password optional
    if (body.password || body.confirmPassword) {
      if (body.password !== body.confirmPassword) {
        return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
      }
      if (String(body.password || "").length < 8) {
        return NextResponse.json({ error: "Password too short" }, { status: 400 });
      }
      updates.passwordHash = await bcrypt.hash(String(body.password), 10);
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
