"use client";

import { useEffect, useState } from "react";

type User = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  suspended?: boolean;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [message, setMessage] = useState("");

  async function load() {
    const response = await fetch("/api/admin/users");
    if (!response.ok) return;
    const data = await response.json();
    setUsers(data.users ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleSuspend(user: User) {
    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, suspended: !user.suspended })
    });
    if (response.ok) {
      setMessage(!user.suspended ? "User suspended." : "User unsuspended.");
      load();
    }
  }

  return (
    <main className="container stack">
      <h1>User management</h1>
      {message ? <div className="notice">{message}</div> : null}
      <div className="card stack">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.fullName}</td>
                <td>{user.email}</td>
                <td>{user.suspended ? "Suspended" : "Active"}</td>
                <td>
                  <button className="button secondary" onClick={() => toggleSuspend(user)}>
                    {user.suspended ? "Unsuspend" : "Suspend"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
