import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "../../../../../lib/auth";
import { readPostReports, updatePostReport } from "../../../../../lib/data/reports";
import { appendAuditEntry } from "../../../../../lib/data/audit";
import { readPosts, writePosts } from "../../../../../lib/data/posts";

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ["admin"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const data = await readPostReports();
  return NextResponse.json({ reports: data.records });
}

export async function POST(request: NextRequest) {
  const auth = await requireRole(request, ["admin"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  try {
    const body = await request.json();
    if (!body.reportId || !body.action) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    if (body.action === "delete") {
      const posts = await readPosts();
      const reportData = await readPostReports();
      const report = reportData.records.find((item) => item.id === body.reportId);
      if (!report) {
        return NextResponse.json({ error: "Report not found" }, { status: 404 });
      }
      const filtered = posts.records.filter((post) => post.id !== report.postId);
      await writePosts(filtered);
      await updatePostReport(body.reportId, {
        status: "actioned",
        reviewedAt: new Date().toISOString(),
        reviewNote: "Post deleted"
      });
      await appendAuditEntry({
        actorUserId: auth.user.id,
        action: "post_report_delete",
        target: report.postId
      });
      return NextResponse.json({ ok: true });
    }
    const updated = await updatePostReport(body.reportId, {
      status: body.action === "reject" ? "rejected" : "actioned",
      reviewedAt: new Date().toISOString(),
      reviewNote: body.note || undefined
    });
    await appendAuditEntry({
      actorUserId: auth.user.id,
      action: "post_report_review",
      target: updated.postId
    });
    return NextResponse.json({ report: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Update failed" },
      { status: 400 }
    );
  }
}
