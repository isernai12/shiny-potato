"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./writer.module.css";

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

  if (user?.role === "admin") {
    return (
      <main className={styles.page}>
        <h1 className={styles.title}>Writer tools</h1>
        <p className={styles.muted}>Admin accounts cannot create posts.</p>
        <button className={styles.buttonSecondary} onClick={() => router.push("/dashboard/admin")}>
          Go to admin dashboard
        </button>
      </main>
    );
  }


  if (!user) {
    return (
      <main className={styles.page}>
        <p className={styles.muted}>Please log in.</p>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Writer tools</h1>
      {message ? <div className={styles.notice}>{message}</div> : null}
      {error ? <div className={styles.notice}>{error}</div> : null}
      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Writer workspace</h2>
        <p className={styles.muted}>Create and manage your posts from separate pages.</p>
        <div className={styles.actionStack}>
          <button className={styles.button} onClick={() => router.push("/dashboard/writer/new")}>
            Create new post
          </button>
          <button
            className={styles.buttonSecondary}
            onClick={() => router.push("/dashboard/writer/posts")}
          >
            Manage posts
          </button>
        </div>
      </div>
      <button className={styles.buttonSecondary} onClick={() => router.push("/dashboard")}>
        Back to dashboard
      </button>
    </main>
  );
}
