"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/me");
      if (response.ok) {
        const data = await response.json();
        setUser(data.user ?? null);
      }
      setLoading(false);
    }
    load();
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/auth/login");
  }

  if (loading) {
    return (
      <main className="container">
        <p>Loading...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="container stack">
        <h1>Dashboard</h1>
        <p>You are not logged in.</p>
        <Link className="button" href="/auth/login">
          Login
        </Link>
      </main>
    );
  }

  return (
    <main className="container stack">
      <h1>Welcome, {user.name}</h1>
      <div className="card stack">
        <p>Email: {user.email}</p>
        <p>Role: {user.role}</p>
        <div className="stack" style={{ gap: 8 }}>
          {user.role === "writer" || user.role === "admin" ? (
            <Link className="button secondary" href="/dashboard/writer">
              Writer tools
            </Link>
          ) : null}
          {user.role === "admin" ? (
            <Link className="button secondary" href="/dashboard/admin">
              Admin tools
            </Link>
          ) : null}
        </div>
      </div>
      <button className="button secondary" onClick={handleLogout}>
        Log out
      </button>
    </main>
  );
}
