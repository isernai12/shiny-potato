import { promises as fs } from "fs";
import path from "path";
import { DataFile } from "./types";

const lockMap = new Map<string, Promise<void>>();
let cachedDataDir: string | null = null;

async function isWritableDir(dir: string) {
  try {
    await fs.access(dir);
    const testFile = path.join(dir, `.writo-test-${Date.now()}`);
    await fs.writeFile(testFile, "ok");
    await fs.unlink(testFile);
    return true;
  } catch (error) {
    return false;
  }
}

export async function getDataDir() {
  if (cachedDataDir) {
    return cachedDataDir;
  }
  const prodDir = "/data";
  if (await isWritableDir(prodDir)) {
    cachedDataDir = prodDir;
    return cachedDataDir;
  }
  const localDir = path.join(process.cwd(), "local-data");
  await fs.mkdir(localDir, { recursive: true });
  cachedDataDir = localDir;
  return cachedDataDir;
}

async function withLock<T>(filePath: string, action: () => Promise<T>) {
  const current = lockMap.get(filePath) ?? Promise.resolve();
  let release: () => void = () => undefined;
  const next = new Promise<void>((resolve) => {
    release = resolve;
  });
  lockMap.set(filePath, current.then(() => next));
  await current;
  try {
    return await action();
  } finally {
    release();
    if (lockMap.get(filePath) === next) {
      lockMap.delete(filePath);
    }
  }
}

async function readJsonFile<T>(filePath: string, fallback: DataFile<T>): Promise<DataFile<T>> {
  try {
    const data = await fs.readFile(filePath, "utf8");
    return JSON.parse(data) as DataFile<T>;
  } catch (error) {
    return fallback;
  }
}

async function writeJsonAtomic<T>(filePath: string, data: DataFile<T>) {
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  const tempPath = path.join(dir, `.tmp-${path.basename(filePath)}-${Date.now()}`);
  await fs.writeFile(tempPath, JSON.stringify(data, null, 2));
  await fs.rename(tempPath, filePath);
}

export async function readDataFile<T>(fileName: string): Promise<DataFile<T>> {
  const dir = await getDataDir();
  const filePath = path.join(dir, fileName);
  return withLock(filePath, async () => {
    const fallback: DataFile<T> = { version: 1, records: [] };
    const data = await readJsonFile(filePath, fallback);
    if (!data.version) {
      data.version = 1;
    }
    if (!Array.isArray(data.records)) {
      data.records = [];
    }
    if (!(await fileExists(filePath))) {
      await writeJsonAtomic(filePath, data);
    }
    return data;
  });
}

export async function writeDataFile<T>(fileName: string, data: DataFile<T>) {
  const dir = await getDataDir();
  const filePath = path.join(dir, fileName);
  return withLock(filePath, async () => {
    await writeJsonAtomic(filePath, data);
  });
}

async function fileExists(filePath: string) {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    return false;
  }
}
