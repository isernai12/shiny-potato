import { NextRequest, NextResponse } from "next/server";
import { requireUser } from "../../../../lib/auth";
import { createWriterRequest } from "../../../../lib/data/writerRequests";

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  try {
    if (auth.user.role !== "user") {
      return NextResponse.json({ error: "Already a writer." }, { status: 400 });
    }
    const requestRecord = await createWriterRequest(auth.user.id);
    return NextResponse.json({ request: requestRecord });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Request failed" },
      { status: 400 }
    );
  }
}
