import { randomUUID } from "crypto";
import { readDataFile, writeDataFile } from "../jsonDb";
import { CommentReport, PostReport } from "../types";

const POST_REPORTS_FILE = "postReports.json";
const COMMENT_REPORTS_FILE = "commentReports.json";

export async function readPostReports() {
  return readDataFile<PostReport>(POST_REPORTS_FILE);
}

export async function readCommentReports() {
  return readDataFile<CommentReport>(COMMENT_REPORTS_FILE);
}

export async function writePostReports(reports: PostReport[]) {
  await writeDataFile(POST_REPORTS_FILE, { version: 1, records: reports });
}

export async function writeCommentReports(reports: CommentReport[]) {
  await writeDataFile(COMMENT_REPORTS_FILE, { version: 1, records: reports });
}

export async function createPostReport(params: {
  postId: string;
  postSlug: string;
  reporterUserId: string;
  reason: string;
}) {
  const data = await readPostReports();
  const report: PostReport = {
    id: randomUUID(),
    postId: params.postId,
    postSlug: params.postSlug,
    reporterUserId: params.reporterUserId,
    reason: params.reason,
    createdAt: new Date().toISOString(),
    status: "pending"
  };
  const updated = [...data.records, report];
  await writePostReports(updated);
  return report;
}

export async function createCommentReport(params: {
  postId: string;
  postSlug: string;
  commentId: string;
  reporterUserId: string;
  reason: string;
}) {
  const data = await readCommentReports();
  const report: CommentReport = {
    id: randomUUID(),
    postId: params.postId,
    postSlug: params.postSlug,
    commentId: params.commentId,
    reporterUserId: params.reporterUserId,
    reason: params.reason,
    createdAt: new Date().toISOString(),
    status: "pending"
  };
  const updated = [...data.records, report];
  await writeCommentReports(updated);
  return report;
}

export async function updatePostReport(reportId: string, updates: Partial<PostReport>) {
  const data = await readPostReports();
  let found: PostReport | undefined;
  const updated = data.records.map((report) => {
    if (report.id !== reportId) return report;
    found = { ...report, ...updates };
    return found;
  });
  if (!found) {
    throw new Error("Report not found.");
  }
  await writePostReports(updated);
  return found;
}

export async function updateCommentReport(reportId: string, updates: Partial<CommentReport>) {
  const data = await readCommentReports();
  let found: CommentReport | undefined;
  const updated = data.records.map((report) => {
    if (report.id !== reportId) return report;
    found = { ...report, ...updates };
    return found;
  });
  if (!found) {
    throw new Error("Report not found.");
  }
  await writeCommentReports(updated);
  return found;
}
