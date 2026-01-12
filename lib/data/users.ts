import bcrypt from "bcryptjs";
import { readDataFile, writeDataFile } from "../jsonDb";
import { Role, User } from "../types";
import { randomUUID } from "crypto";

const USERS_FILE = "users.json";

export async function readUsers() {
  const data = await readDataFile<User>(USERS_FILE);
  if (data.records.length === 0) {
    const now = new Date().toISOString();
    const passwordHash = await bcrypt.hash("admin12345", 10);
    data.records.push({
      id: randomUUID(),
      email: "admin@writo.local",
      name: "Default Admin",
      passwordHash,
      role: "admin",
      createdAt: now
    });
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
  name: string;
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
    name: params.name,
    passwordHash,
    role: params.role ?? "user",
    createdAt: now
  };
  const updated = [...data.records, user];
  await writeUsers(updated);
  return user;
}

export async function updateUserRole(userId: string, role: Role) {
  const data = await readUsers();
  const updated = data.records.map((user) =>
    user.id === userId ? { ...user, role } : user
  );
  await writeUsers(updated);
}
