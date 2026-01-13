"use client";

import { useEffect, useState } from "react";

type Entry = {
  id: string;
  actorUserId: string;
  action: string;
  target?: string;
  createdAt: string;
};

export default function AuditLogPage() {
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/admin/audit");
      if (!response.ok) return;
      const data = await response.json();
      setEntries(data.entries ?? []);
    }
    load();
  }, []);

  return (
    <main className="container stack">
      <h1>Audit log</h1>
      <div className="card stack">
        {entries.length === 0 ? (
          <p>No audit entries yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Actor</th>
                <th>Target</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.action}</td>
                  <td>{entry.actorUserId}</td>
                  <td>{entry.target ?? "-"}</td>
                  <td>{new Date(entry.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
