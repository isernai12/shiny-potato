"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./dashboard.module.css";

type User = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  avatarUrl?: string;
};

type Post = {
  id: string;
  status: string;
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/me");
      let meData: { user: User | null } = { user: null };
      if (response.ok) {
        meData = await response.json();
        setUser(meData.user ?? null);
      }
      if (meData.user && meData.user.role !== "admin") {
        const postResponse = await fetch("/api/writer/posts");
        if (postResponse.ok) {
          const postData = await postResponse.json();
          setPosts(postData.posts ?? []);
        }
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
      <main className={styles.page}>
        <p className={styles.muted}>Loading...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className={styles.page}>
        <h1 className={styles.title}>Dashboard</h1>
        <p className={styles.muted}>You are not logged in.</p>
        <button className={styles.button} onClick={() => router.push("/auth/login")}>
          Login
        </button>
      </main>
    );
  }

  const totalPosts = posts.length;
  const pendingPosts = posts.filter((post) => post.status === "submitted").length;
  const draftPosts = posts.filter((post) => post.status === "draft").length;
  const publishedPosts = posts.filter((post) => post.status === "approved").length;

  return (
    <main className={styles.page}>
      <div className={styles.profileCard}>
        <div className={styles.profileAvatar}>
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.fullName} />
          ) : (
            <span>{user.fullName.charAt(0)}</span>
          )}
        </div>
        <div className={styles.profileMeta}>
          <h1 className={styles.title}>{user.fullName}</h1>
          <p className={styles.muted}>{user.email}</p>
        </div>
      </div>
      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Quick actions</h2>
        <div className={styles.actionStack}>
          {user.role !== "admin" ? (
            <>
              <button className={styles.button} onClick={() => router.push("/dashboard/writer/new")}>
                Create post
              </button>
              <button
                className={styles.buttonSecondary}
                onClick={() => router.push("/dashboard/writer/posts")}
              >
                Manage posts
              </button>
            </>
          ) : null}
          <button className={styles.buttonSecondary} onClick={() => router.push("/profile")}>
            Profile
          </button>
          {user.role === "admin" ? (
            <button className={styles.buttonSecondary} onClick={() => router.push("/dashboard/admin")}>
              Admin tools
            </button>
          ) : null}
        </div>
      </div>
      <div className={styles.grid}>
        <div className={styles.card}>
          <h3 className={styles.metricTitle}>Your total posts</h3>
          <p className={styles.metricValue}>{totalPosts}</p>
        </div>
        <div className={styles.card}>
          <h3 className={styles.metricTitle}>Pending posts</h3>
          <p className={styles.metricValue}>{pendingPosts}</p>
        </div>
        <div className={styles.card}>
          <h3 className={styles.metricTitle}>Draft posts</h3>
          <p className={styles.metricValue}>{draftPosts}</p>
        </div>
        <div className={styles.card}>
          <h3 className={styles.metricTitle}>Published posts</h3>
          <p className={styles.metricValue}>{publishedPosts}</p>
        </div>
      </div>
      <button className={styles.buttonSecondary} onClick={handleLogout}>
        Log out
      </button>
    </main>
  );
}
