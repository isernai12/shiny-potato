import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { promises as fs } from "fs";
import { getUploadsDir } from "../../../../lib/uploads";

const CONTENT_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif"
};

export async function GET(
  request: NextRequest,
  context: { params: { filename: string } }
) {
  try {
    const uploadsDir = await getUploadsDir();
    const filePath = path.join(uploadsDir, context.params.filename);
    const data = await fs.readFile(filePath);
    const ext = path.extname(context.params.filename).toLowerCase();
    const contentType = CONTENT_TYPES[ext] ?? "application/octet-stream";
    return new NextResponse(data, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    });
  } catch (error) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
