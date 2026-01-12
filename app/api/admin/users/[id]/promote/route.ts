import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "../../../../../../lib/auth";
import { updateUserRole } from "../../../../../../lib/data/users";

export async function POST(request: NextRequest, context: { params: { id: string } }) {
  const auth = await requireRole(request, ["admin"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  try {
    await updateUserRole(context.params.id, "writer");
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Promotion failed" },
      { status: 400 }
    );
  }
}
