import { randomUUID } from "crypto";
import { readDataFile, writeDataFile } from "../jsonDb";
import { Session } from "../types";

const SESSIONS_FILE = "sessions.json";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14;

export async function readSessions() {
  return readDataFile<Session>(SESSIONS_FILE);
}

export async function writeSessions(sessions: Session[]) {
  await writeDataFile(SESSIONS_FILE, { version: 1, records: sessions });
}

export async function createSession(userId: string) {
  const data = await readSessions();
  const now = Date.now();
  const session: Session = {
    id: randomUUID(),
    userId,
    createdAt: new Date(now).toISOString(),
    expiresAt: new Date(now + SESSION_TTL_MS).toISOString()
  };
  const updated = [...data.records, session];
  await writeSessions(updated);
  return session;
}

export async function deleteSession(sessionId: string) {
  const data = await readSessions();
  const updated = data.records.filter((session) => session.id !== sessionId);
  await writeSessions(updated);
}

export async function findSession(sessionId: string) {
  const data = await readSessions();
  const now = new Date();
  const session = data.records.find((record) => record.id === sessionId);
  if (!session) return undefined;
  if (new Date(session.expiresAt) <= now) {
    await deleteSession(sessionId);
    return undefined;
  }
  return session;
}
