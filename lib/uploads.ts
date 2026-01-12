import path from "path";
import { promises as fs } from "fs";
import { randomUUID } from "crypto";
import { getDataDir } from "./jsonDb";

export async function getUploadsDir() {
  const dataDir = await getDataDir();
  const uploadsDir = path.join(dataDir, "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });
  return uploadsDir;
}

export function buildUploadName(originalName: string) {
  const ext = path.extname(originalName) || ".bin";
  return `${randomUUID()}${ext}`;
}
