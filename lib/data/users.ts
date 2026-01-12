import bcrypt from "bcryptjs";
import { readDataFile, writeDataFile } from "../jsonDb";
import { Role, User } from "../types";
import { randomUUID } from "crypto";

const USERS_FILE = "users.json";

function cleanString(value: unknown) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function limit3(list: unknown) {
  if (!Array.isArray(list)) return [];
  return list.filter((x) => typeof x === "string").slice(0, 3);
}

export async function readUsers() {
  const data = await readDataFile<User>(USERS_FILE);
  let needsRewrite = false;

  data.records = data.records.map((user) => {
    let next = user as User;

    // legacy "name" -> fullName
    if (!next.fullName && (next as unknown as { name?: string }).name) {
      needsRewrite = true;
      next = { ...next, fullName: (next as unknown as { name?: string }).name ?? "User" };
    }

    if (next.suspended === undefined) {
      needsRewrite = true;
      next = { ...next, suspended: false };
    }

    if (next.bio === undefined) {
      needsRewrite = true;
      next = { ...next, bio: "" };
    }

    // ✅ NEW defaults + normalize
    const anyUser = next as unknown as {
      socials?: unknown;
      hobbies?: unknown;
      categories?: unknown;
    };

    // socials default
    if (!anyUser.socials || typeof anyUser.socials !== "object") {
      needsRewrite = true;
      next = { ...next, socials: {} };
    }

    // hobbies default + max3
    const hobbies = limit3(anyUser.hobbies);
    if (!Array.isArray(anyUser.hobbies) || hobbies.length !== (anyUser.hobbies as any[])?.length) {
      needsRewrite = true;
      next = { ...next, hobbies };
    }

    // categories default + max3
    const categories = limit3(anyUser.categories);
    if (
      !Array.isArray(anyUser.categories) ||
      categories.length !== (anyUser.categories as any[])?.length
    ) {
      needsRewrite = true;
      next = { ...next, categories };
    }

    return next;
  });

  // default admin seed
  if (data.records.length === 0) {
    const now = new Date().toISOString();
    const passwordHash = await bcrypt.hash("admin12345", 10);
    data.records.push({
      id: randomUUID(),
      email: "admin@writo.local",
      fullName: "Default Admin",
      bio: "",
      socials: {},
      hobbies: [],
      categories: [],
      passwordHash,
      role: "admin",
      suspended: false,
      createdAt: now
    });
    needsRewrite = true;
  }

  if (needsRewrite) {
    await writeDataFile(USERS_FILE, data);
  }

  return data;
}

export async function writeUsers(users: User[]) {
  await writeDataFile(USERS_FILE, { version: 1, records: users });
}

export async function findUserByEmail(email: string) {
  const data = await readUsers();
  return data.records.find((user) => user.email.toLowerCase() === email.toLowerCase());
}

export async function findUserById(id: string) {
  const data = await readUsers();
  return data.records.find((user) => user.id === id);
}

export async function createUser(params: {
  email: string;
  fullName: string;
  password: string;
  role?: Role;
}) {
  const data = await readUsers();
  const exists = data.records.some(
    (user) => user.email.toLowerCase() === params.email.toLowerCase()
  );
  if (exists) {
    throw new Error("Email already registered.");
  }

  const now = new Date().toISOString();
  const passwordHash = await bcrypt.hash(params.password, 10);

  const user: User = {
    id: randomUUID(),
    email: params.email,
    fullName: params.fullName,
    bio: "",
    socials: {},
    hobbies: [],
    categories: [],
    passwordHash,
    role: params.role ?? "user",
    suspended: false,
    createdAt: now
  };

  const updated = [...data.records, user];
  await writeUsers(updated);
  return user;
}

export async function updateUserRole(userId: string, role: Role) {
  const data = await readUsers();
  const updated = data.records.map((user) => (user.id === userId ? { ...user, role } : user));
  await writeUsers(updated);
}

export async function updateUserProfile(
  userId: string,
  updates: Partial<
    Pick<User, "fullName" | "avatarUrl" | "passwordHash" | "bio" | "socials" | "hobbies" | "categories">
  >
) {
  const data = await readUsers();
  let found = false;

  const updated = data.records.map((user) => {
    if (user.id !== userId) return user;
    found = true;

    const mergedSocials = {
      ...(user.socials ?? {}),
      ...(updates.socials ?? {})
    };

    // empty string remove
    Object.keys(mergedSocials).forEach((k) => {
      const v = (mergedSocials as any)[k];
      if (typeof v === "string" && !v.trim()) delete (mergedSocials as any)[k];
      if (v === undefined || v === null) delete (mergedSocials as any)[k];
    });

    const next: User = {
      ...user,
      ...updates,
      socials: mergedSocials,
      hobbies: updates.hobbies ? updates.hobbies.slice(0, 3) : user.hobbies ?? [],
      categories: updates.categories ? updates.categories.slice(0, 3) : user.categories ?? []
    };

    return next;
  });

  if (!found) {
    throw new Error("User not found.");
  }

  await writeUsers(updated);
}

export async function setUserSuspended(userId: string, suspended: boolean) {
  const data = await readUsers();
  let found = false;
  const updated = data.records.map((user) => {
    if (user.id !== userId) return user;
    found = true;
    return { ...user, suspended };
  });
  if (!found) {
    throw new Error("User not found.");
  }
  await writeUsers(updated);
}
