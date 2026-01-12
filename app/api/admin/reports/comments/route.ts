import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "../../../../../lib/auth";
import { readCommentReports, updateCommentReport } from "../../../../../lib/data/reports";
import { appendAuditEntry } from "../../../../../lib/data/audit";
import { readPosts, writePosts } from "../../../../../lib/data/posts";

export async function GET(request: NextRequest) {
  const auth = await requireRole(request, ["admin"]);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  const data = await readCommentReports();
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
      const reports = await readCommentReports();
      const report = reports.records.find((item) => item.id === body.reportId);
      if (!report) {
        return NextResponse.json({ error: "Report not found" }, { status: 404 });
      }
      const posts = await readPosts();
      const updatedPosts = posts.records.map((post) => {
        if (post.id !== report.postId) return post;
        return {
          ...post,
          comments: post.comments.filter((comment) => comment.id !== report.commentId)
        };
      });
      await writePosts(updatedPosts);
      await updateCommentReport(body.reportId, {
        status: "actioned",
        reviewedAt: new Date().toISOString(),
        reviewNote: "Comment deleted"
      });
      await appendAuditEntry({
        actorUserId: auth.user.id,
        action: "comment_report_delete",
        target: report.commentId
      });
      return NextResponse.json({ ok: true });
    }
    const updated = await updateCommentReport(body.reportId, {
      status: body.action === "reject" ? "rejected" : "actioned",
      reviewedAt: new Date().toISOString(),
      reviewNote: body.note || undefined
    });
    await appendAuditEntry({
      actorUserId: auth.user.id,
      action: "comment_report_review",
      target: updated.commentId
    });
    return NextResponse.json({ report: updated });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Update failed" },
      { status: 400 }
    );
  }
}
