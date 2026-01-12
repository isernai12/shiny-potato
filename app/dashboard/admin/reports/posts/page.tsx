"use client";

import { useEffect, useState } from "react";
import styles from "./posts.module.css";

type Report = {
  id: string;
  postId: string;
  postSlug: string;
  reporterUserId: string;
  reason: string;
  status: string;
  createdAt: string;
};

export default function PostReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [note, setNote] = useState<Record<string, string>>({});

  async function load() {
    const response = await fetch("/api/admin/reports/posts");
    if (!response.ok) return;
    const data = await response.json();
    setReports(data.reports ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAction(reportId: string, action: string) {
    await fetch("/api/admin/reports/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId, action, note: note[reportId] || "" })
    });
    load();
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Post reports</h1>
      <div className={styles.card}>
        {reports.length === 0 ? (
          <p className={styles.muted}>No reports.</p>
        ) : (
          <table className={styles.table}>
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
                    <a className={styles.buttonSecondary} href={`/post/${report.postSlug}`}>
                      View post
                    </a>
                  </td>
                  <td>{report.reason}</td>
                  <td>{report.status}</td>
                  <td>
                    <input
                      className={styles.input}
                      value={note[report.id] || ""}
                      onChange={(event) =>
                        setNote((prev) => ({ ...prev, [report.id]: event.target.value }))
                      }
                    />
                  </td>
                  <td>
                    <div className={styles.actionStack}>
                      <button
                        className={styles.buttonSecondary}
                        onClick={() => handleAction(report.id, "reject")}
                      >
                        Reject
                      </button>
                      <button
                        className={styles.buttonSecondary}
                        onClick={() => handleAction(report.id, "delete")}
                      >
                        Delete post
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
