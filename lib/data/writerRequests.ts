import { randomUUID } from "crypto";
import { readDataFile, writeDataFile } from "../jsonDb";
import { WriterRequest } from "../types";

const REQUESTS_FILE = "writerRequests.json";

export async function readWriterRequests() {
  return readDataFile<WriterRequest>(REQUESTS_FILE);
}

export async function writeWriterRequests(requests: WriterRequest[]) {
  await writeDataFile(REQUESTS_FILE, { version: 1, records: requests });
}

export async function createWriterRequest(userId: string) {
  const data = await readWriterRequests();
  const hasPending = data.records.some(
    (request) => request.userId === userId && request.status === "pending"
  );
  if (hasPending) {
    throw new Error("You already have a pending request.");
  }
  const request: WriterRequest = {
    id: randomUUID(),
    userId,
    createdAt: new Date().toISOString(),
    status: "pending"
  };
  const updated = [...data.records, request];
  await writeWriterRequests(updated);
  return request;
}

export async function updateWriterRequest(
  requestId: string,
  updates: Partial<WriterRequest>
) {
  const data = await readWriterRequests();
  let found: WriterRequest | undefined;
  const updated = data.records.map((request) => {
    if (request.id !== requestId) return request;
    found = { ...request, ...updates };
    return found;
  });
  if (!found) {
    throw new Error("Request not found.");
  }
  await writeWriterRequests(updated);
  return found;
}
