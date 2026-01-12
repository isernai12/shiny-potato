"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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
        <button className="button" onClick={() => router.push("/auth/login")}>
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
    <main className="container stack">
      <div className="card stack dashboard-profile">
        <div className="dashboard-profile__avatar">
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.fullName} />
          ) : (
            <span>{user.fullName.charAt(0)}</span>
          )}
        </div>
        <div>
          <h1>{user.fullName}</h1>
          <p>{user.email}</p>
        </div>
      </div>
      <div className="card stack">
        <h2>Quick actions</h2>
        <div className="stack" style={{ gap: 8 }}>
          {user.role !== "admin" ? (
            <>
              <button className="button" onClick={() => router.push("/dashboard/writer/new")}>
                Create post
              </button>
              <button
                className="button secondary"
                onClick={() => router.push("/dashboard/writer/posts")}
              >
                Manage posts
              </button>
            </>
          ) : null}
          <button className="button secondary" onClick={() => router.push("/profile")}>
            Profile
          </button>
          {user.role === "admin" ? (
            <button className="button secondary" onClick={() => router.push("/dashboard/admin")}>
              Admin tools
            </button>
          ) : null}
        </div>
      </div>
      <div className="grid two">
        <div className="card stack">
          <h3>Your total posts</h3>
          <p>{totalPosts}</p>
        </div>
        <div className="card stack">
          <h3>Pending posts</h3>
          <p>{pendingPosts}</p>
        </div>
        <div className="card stack">
          <h3>Draft posts</h3>
          <p>{draftPosts}</p>
        </div>
        <div className="card stack">
          <h3>Published posts</h3>
          <p>{publishedPosts}</p>
        </div>
      </div>
      <button className="button secondary" onClick={handleLogout}>
        Log out
      </button>
    </main>
  );
}
