"use client";

import { useEffect, useState } from "react";

type Report = {
  id: string;
  postId: string;
  postSlug: string;
  commentId: string;
  reason: string;
  status: string;
};

export default function CommentReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [note, setNote] = useState<Record<string, string>>({});

  async function load() {
    const response = await fetch("/api/admin/reports/comments");
    if (!response.ok) return;
    const data = await response.json();
    setReports(data.reports ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAction(reportId: string, action: string) {
    await fetch("/api/admin/reports/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId, action, note: note[reportId] || "" })
    });
    load();
  }

  return (
    <main className="container stack">
      <h1>Comment reports</h1>
      <div className="card stack">
        {reports.length === 0 ? (
          <p>No reports.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Post</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Note</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr key={report.id}>
                  <td>
                    <a className="button secondary" href={`/post/${report.postSlug}`}>
                      View post
                    </a>
                  </td>
                  <td>{report.reason}</td>
                  <td>{report.status}</td>
                  <td>
                    <input
                      className="input"
                      value={note[report.id] || ""}
                      onChange={(event) =>
                        setNote((prev) => ({ ...prev, [report.id]: event.target.value }))
                      }
                    />
                  </td>
                  <td>
                    <div className="stack" style={{ gap: 8 }}>
                      <button
                        className="button secondary"
                        onClick={() => handleAction(report.id, "reject")}
                      >
                        Reject
                      </button>
                      <button
                        className="button secondary"
                        onClick={() => handleAction(report.id, "delete")}
                      >
                        Delete comment
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
