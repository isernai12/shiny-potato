"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  fullName: string;
  email: string;
  role: string;
};

type Post = {
  id: string;
  title: string;
  status: string;
  slug: string;
  reviewNote?: string;
};

export default function WriterDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/me");
      if (!response.ok) return;
      const data = await response.json();
      if (!data.user) return;
      setUser(data.user);
    }
    load();
  }, []);


  if (!user) {
    return (
      <main className="container">
        <p>Please log in.</p>
      </main>
    );
  }

  return (
    <main className="container stack">
      <h1>Writer tools</h1>
      {message ? <div className="notice">{message}</div> : null}
      {error ? <div className="notice">{error}</div> : null}
      <div className="card stack">
        <h2>Writer workspace</h2>
        <p>Create and manage your posts from separate pages.</p>
        <div className="stack" style={{ gap: 8 }}>
          <button className="button" onClick={() => router.push("/dashboard/writer/new")}>
            Create new post
          </button>
          <button
            className="button secondary"
            onClick={() => router.push("/dashboard/writer/posts")}
          >
            Manage posts
          </button>
        </div>
      </div>
      <button className="button secondary" onClick={() => router.push("/dashboard")}
      >
        Back to dashboard
      </button>
    </main>
  );
}
