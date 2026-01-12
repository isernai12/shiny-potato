import { randomUUID } from "crypto";
import { readDataFile, writeDataFile } from "../jsonDb";
import { AuditLogEntry } from "../types";

const AUDIT_FILE = "auditLog.json";

export async function readAuditLog() {
  return readDataFile<AuditLogEntry>(AUDIT_FILE);
}

export async function appendAuditEntry(entry: Omit<AuditLogEntry, "id" | "createdAt">) {
  const data = await readAuditLog();
  const record: AuditLogEntry = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    ...entry
  };
  const updated = [...data.records, record];
  await writeDataFile(AUDIT_FILE, { version: 1, records: updated });
  return record;
}
