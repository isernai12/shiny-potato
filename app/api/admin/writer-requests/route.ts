import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "../../../../lib/auth";
import { readWriterRequests } from "../../../../lib/data/writerRequests";

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ["admin"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const data = await readWriterRequests();
  const pending = data.records.filter((record) => record.status === "pending");
  return NextResponse.json({ requests: pending });
}
