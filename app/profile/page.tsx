"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./profile.module.css";

type User = {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  role: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [bio, setBio] = useState("");
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
      setBio(data.user?.bio ?? "");
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
    let updatedAvatarUrl = avatarUrl;
    if (avatarFile) {
      const formData = new FormData();
      formData.append("file", avatarFile);
      const uploadResponse = await fetch("/api/uploads", {
        method: "POST",
        body: formData
      });
      if (!uploadResponse.ok) {
        const data = await uploadResponse.json();
        setError(data.error || "Failed to upload avatar");
        return;
      }
      const data = await uploadResponse.json();
      updatedAvatarUrl = data.url;
    }

    const response = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName,
        avatarUrl: updatedAvatarUrl,
        bio,
        password,
        confirmPassword
      })
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
    setAvatarFile(null);
    setMessage("Profile updated.");
  }

  if (!user) {
    return (
      <main className={styles.page}>
        <h1 className={styles.title}>Profile</h1>
        {error ? <div className={styles.notice}>{error}</div> : null}
        <button className={styles.buttonSecondary} onClick={() => router.push("/auth/login")}>
          Go to login
        </button>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Your Profile</h1>
      {message ? <div className={styles.notice}>{message}</div> : null}
      {error ? <div className={styles.notice}>{error}</div> : null}
      <div className={styles.card}>
        <p className={styles.meta}>Email (cannot change): {user.email}</p>
        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.field}>
            Full Name
            <input
              className={styles.input}
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              required
            />
          </label>
          <label className={styles.field}>
            Avatar URL (optional)
            <input
              className={styles.input}
              value={avatarUrl}
              onChange={(event) => setAvatarUrl(event.target.value)}
            />
          </label>
          <label className={styles.field}>
            Bio
            <textarea
              className={styles.textarea}
              rows={4}
              value={bio}
              onChange={(event) => setBio(event.target.value)}
            />
          </label>
          <label className={styles.field}>
            Upload Avatar
            <input
              className={styles.input}
              type="file"
              accept="image/*"
              onChange={(event) => setAvatarFile(event.target.files?.[0] ?? null)}
            />
          </label>
          <label className={styles.field}>
            New Password (optional)
            <input
              className={styles.input}
              type="password"
              minLength={8}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <label className={styles.field}>
            Confirm New Password
            <input
              className={styles.input}
              type="password"
              minLength={8}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </label>
          <button className={styles.button} type="submit">
            Save changes
          </button>
        </form>
      </div>
      <button className={styles.buttonSecondary} onClick={() => router.push("/dashboard")}>
        Back to dashboard
      </button>
    </main>
  );
}
