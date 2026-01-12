"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  role: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/profile");
      if (!response.ok) {
        setError("Please log in.");
        return;
      }
      const data = await response.json();
      setUser(data.user);
      setFullName(data.user?.fullName ?? "");
      setAvatarUrl(data.user?.avatarUrl ?? "");
    }
    load();
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    setError("");
    if (password || confirmPassword) {
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }
    const response = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, avatarUrl, password, confirmPassword })
    });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error || "Failed to update profile");
      return;
    }
    const data = await response.json();
    setUser(data.user);
    setPassword("");
    setConfirmPassword("");
    setMessage("Profile updated.");
  }

  if (!user) {
    return (
      <main className="container stack">
        <h1>Profile</h1>
        {error ? <div className="notice">{error}</div> : null}
        <button className="button secondary" onClick={() => router.push("/auth/login")}>
          Go to login
        </button>
      </main>
    );
  }

  return (
    <main className="container stack">
      <h1>Your Profile</h1>
      {message ? <div className="notice">{message}</div> : null}
      {error ? <div className="notice">{error}</div> : null}
      <div className="card stack">
        <p>Email (cannot change): {user.email}</p>
        <form className="stack" onSubmit={handleSubmit}>
          <label className="stack" style={{ gap: 4 }}>
            Full Name
            <input
              className="input"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
            />
          </label>
          <label className="stack" style={{ gap: 4 }}>
            Avatar URL (optional)
            <input
              className="input"
              value={avatarUrl}
              onChange={(event) => setAvatarUrl(event.target.value)}
            />
          </label>
          <label className="stack" style={{ gap: 4 }}>
            New Password (optional)
            <input
              className="input"
              type="password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <label className="stack" style={{ gap: 4 }}>
            Confirm New Password
            <input
              className="input"
              type="password"
              minLength={8}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </label>
          <button className="button" type="submit">
            Save changes
          </button>
        </form>
      </div>
      <button className="button secondary" onClick={() => router.push("/dashboard")}>
        Back to dashboard
      </button>
    </main>
  );
}
