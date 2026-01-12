"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./profile.module.css";

import {
  Badge,
  Camera,
  Lock,
  Mail,
  Save,
  Trash2,
  Upload,
  UserCog,
  Quote
} from "lucide-react";

type User = {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  role: string;
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);

  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");

  const [avatarUrl, setAvatarUrl] = useState(""); // saved url (or manual url)
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const avatarPreviewUrl = useMemo(() => {
    if (avatarFile) return URL.createObjectURL(avatarFile);
    return avatarUrl || "";
  }, [avatarFile, avatarUrl]);

  useEffect(() => {
    // cleanup object URL if created
    return () => {
      if (avatarFile) URL.revokeObjectURL(avatarPreviewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avatarFile]);

  useEffect(() => {
    async function load() {
      setError("");
      setMessage("");

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

  const bioCount = bio.length;

  function pickPhoto() {
    fileInputRef.current?.click();
  }

  function onPhotoChange(file: File | null) {
    setMessage("");
    setError("");

    if (!file) {
      setAvatarFile(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Only image files allowed.");
      return;
    }
    // (demo) 2MB limit like your template
    if (file.size > 2 * 1024 * 1024) {
      setError("Max 2MB image allowed.");
      return;
    }
    setAvatarFile(file);
  }

  function removePhoto() {
    setMessage("");
    setError("");
    setAvatarFile(null);
    setAvatarUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");

    if ((password || confirmPassword) && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    let updatedAvatarUrl = avatarUrl;

    // Upload file if selected
    if (avatarFile) {
      const formData = new FormData();
      formData.append("file", avatarFile);

      const uploadResponse = await fetch("/api/uploads", {
        method: "POST",
        body: formData
      });

      if (!uploadResponse.ok) {
        const data = await uploadResponse.json().catch(() => ({}));
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
      const data = await response.json().catch(() => ({}));
      setError(data.error || "Failed to update profile");
      return;
    }

    const data = await response.json();
    setUser(data.user);
    setAvatarUrl(data.user?.avatarUrl ?? updatedAvatarUrl);

    setPassword("");
    setConfirmPassword("");
    setAvatarFile(null);

    setMessage("✅ Profile updated.");
  }

  // Not logged in
  if (!user) {
    return (
      <main className={styles.wrap}>
        <section className={styles.panel} aria-label="Manage profile">
          <div className={styles.panelHead}>
            <div className={styles.panelTitle}>
              <UserCog /> Manage Profile
            </div>
          </div>

          <div className={styles.panelBody}>
            {error ? <div className={cn(styles.alert, styles.alertError)}>{error}</div> : null}

            <div className={styles.actionBar}>
              <button className={cn(styles.btn, styles.primary)} type="button" onClick={() => router.push("/auth/login")}>
                Go to login
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.wrap}>
      <section className={styles.panel} aria-label="Manage profile">
        <div className={styles.panelHead}>
          <div className={styles.panelTitle}>
            <UserCog /> Manage Profile
          </div>
        </div>

        <div className={styles.panelBody}>
          {message ? <div className={cn(styles.alert, styles.alertOk)}>{message}</div> : null}
          {error ? <div className={cn(styles.alert, styles.alertError)}>{error}</div> : null}

          {/* Top row */}
          <div className={styles.profileTop}>
            <div className={styles.avatarBox} aria-label="Profile picture preview">
              {avatarPreviewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarPreviewUrl} alt="Profile avatar preview" />
              ) : (
                <div className={styles.avatarFallback}>
                  {(user.fullName?.trim()?.charAt(0) || "W").toUpperCase()}
                </div>
              )}

              <div className={styles.avatarBadge} title="Change photo" onClick={pickPhoto} role="button" aria-label="Change photo">
                <Camera />
              </div>
            </div>

            <div className={styles.btnRow}>
              <button className={styles.btn} type="button" onClick={pickPhoto}>
                <Upload /> Upload Photo
              </button>

              <button className={cn(styles.btn, styles.danger)} type="button" onClick={removePhoto}>
                <Trash2 /> Remove
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(ev) => onPhotoChange(ev.target.files?.[0] ?? null)}
              />
            </div>
          </div>

          {/* Form */}
          <form className={styles.grid} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <div className={styles.label}>
                <Mail /> Email <span className={styles.mutedSmall}>(cannot change)</span>
              </div>
              <input className={styles.input} value={user.email} readOnly />
            </div>

            <div className={styles.field}>
              <div className={styles.label}>
                <Badge /> Display Name
              </div>
              <input
                className={styles.input}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your public name"
                required
              />
            </div>

            <div className={styles.field}>
              <div className={styles.label}>
                <Quote /> Bio / Intro
              </div>
              <textarea
                className={styles.textarea}
                value={bio}
                onChange={(e) => setBio(e.target.value.slice(0, 260))}
                maxLength={260}
                placeholder="Write a short intro (max 260 chars)"
              />
              <div className={styles.countRow}>
                <span />
                <span>
                  {bioCount}/260
                </span>
              </div>
            </div>

            <div className={styles.sectionTitle}>
              <div>Password</div>
              <span>Optional</span>
            </div>

            <div className={styles.twoCols}>
              <div className={styles.field}>
                <div className={styles.label}>
                  <Lock /> New Password
                </div>
                <input
                  className={styles.input}
                  type="password"
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create new password"
                />
              </div>

              <div className={styles.field}>
                <div className={styles.label}>
                  <Lock /> Confirm Password
                </div>
                <input
                  className={styles.input}
                  type="password"
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>
            </div>

            <div className={styles.actionBar}>
              <button className={cn(styles.btn, styles.primary)} type="submit">
                <Save /> Save
              </button>

              <button className={styles.btn} type="button" onClick={() => router.push("/dashboard")}>
                Back
              </button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
