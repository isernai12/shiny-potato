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
  Quote,
  CheckCircle2,
  AlertTriangle,
  X,
  Plus,
  Check,
  ExternalLink,
  Globe,
  Github,
  Facebook,
  Twitter,
  Instagram,
  Youtube
} from "lucide-react";

type SocialLinks = {
  facebook?: string;
  x?: string;
  instagram?: string;
  youtube?: string;
  github?: string;
  website?: string;
};

type User = {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  role: string;

  socials?: SocialLinks;
  hobbies?: string[];
  categories?: string[];
};

type Flash = {
  kind: "success" | "error";
  title: string;
  message?: string;
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const templates = {
  hobbies: [
    { id: "photography", label: "Photography" },
    { id: "travel", label: "Travel" },
    { id: "reading", label: "Reading" },
    { id: "music", label: "Music" },
    { id: "gaming", label: "Gaming" },
    { id: "fitness", label: "Fitness" },
    { id: "cooking", label: "Cooking" },
    { id: "coding", label: "Coding" },
    { id: "design", label: "Design" }
  ],
  categories: [
    { id: "ai", label: "AI" },
    { id: "technology", label: "Technology" },
    { id: "design", label: "Design" },
    { id: "business", label: "Business" },
    { id: "lifestyle", label: "Lifestyle" },
    { id: "productivity", label: "Productivity" },
    { id: "tutorials", label: "Tutorials" },
    { id: "news", label: "News" },
    { id: "career", label: "Career" }
  ]
};

function limit3(list: string[]) {
  return list.slice(0, 3);
}

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);

  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");

  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [socials, setSocials] = useState<SocialLinks>({
    facebook: "",
    x: "",
    instagram: "",
    youtube: "",
    github: "",
    website: ""
  });

  const [hobbies, setHobbies] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [flash, setFlash] = useState<Flash | null>(null);
  const flashTimerRef = useRef<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function clearFlashTimer() {
    if (flashTimerRef.current) {
      window.clearTimeout(flashTimerRef.current);
      flashTimerRef.current = null;
    }
  }

  function showFlash(next: Flash, autoHideMs = 3500) {
    clearFlashTimer();
    setFlash(next);
    flashTimerRef.current = window.setTimeout(() => {
      setFlash(null);
      flashTimerRef.current = null;
    }, autoHideMs);
  }

  useEffect(() => {
    return () => clearFlashTimer();
  }, []);

  const avatarPreviewUrl = useMemo(() => {
    if (avatarFile) return URL.createObjectURL(avatarFile);
    return avatarUrl || "";
  }, [avatarFile, avatarUrl]);

  useEffect(() => {
    return () => {
      if (avatarFile) URL.revokeObjectURL(avatarPreviewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avatarFile]);

  useEffect(() => {
    async function load() {
      setFlash(null);

      const response = await fetch("/api/profile");
      if (!response.ok) {
        showFlash(
          {
            kind: "error",
            title: "You’re not logged in",
            message: "Please log in to manage your profile."
          },
          6000
        );
        return;
      }

      const data = await response.json();
      const u: User | null = data.user ?? null;

      setUser(u);

      setFullName(u?.fullName ?? "");
      setAvatarUrl(u?.avatarUrl ?? "");
      setBio(u?.bio ?? "");

      setSocials({
        facebook: u?.socials?.facebook ?? "",
        x: u?.socials?.x ?? "",
        instagram: u?.socials?.instagram ?? "",
        youtube: u?.socials?.youtube ?? "",
        github: u?.socials?.github ?? "",
        website: u?.socials?.website ?? ""
      });

      setHobbies(limit3(u?.hobbies ?? []));
      setCategories(limit3(u?.categories ?? []));
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bioCount = bio.length;

  function pickPhoto() {
    fileInputRef.current?.click();
  }

  function onPhotoChange(file: File | null) {
    setFlash(null);

    if (!file) {
      setAvatarFile(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      showFlash({ kind: "error", title: "Invalid file", message: "Only image files are allowed." });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showFlash({ kind: "error", title: "Too large", message: "Max 2MB image allowed." });
      return;
    }
    setAvatarFile(file);
  }

  function removePhoto() {
    setFlash(null);
    setAvatarFile(null);
    setAvatarUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    showFlash({ kind: "success", title: "Photo removed", message: "Your avatar will be cleared after saving." });
  }

  function togglePick(kind: "hobbies" | "categories", id: string) {
    setFlash(null);

    const current = kind === "hobbies" ? hobbies : categories;
    const set = kind === "hobbies" ? setHobbies : setCategories;

    const exists = current.includes(id);
    if (exists) {
      set(current.filter((x) => x !== id));
      return;
    }

    if (current.length >= 3) {
      showFlash({ kind: "error", title: "Max 3", message: "You can select up to 3 items." }, 4500);
      return;
    }

    set([...current, id]);
  }

  function previewData() {
    const payload = {
      fullName,
      email: user?.email,
      avatarUrl: avatarFile ? "(selected file)" : avatarUrl,
      bio,
      socials,
      hobbies,
      categories
    };

    const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Preview Data</title>
<style>body{font-family:ui-monospace,monospace;background:#0a0a0a;color:#e5e7eb;padding:16px}pre{white-space:pre-wrap;word-break:break-word}</style>
</head><body><pre>${JSON.stringify(payload, null, 2).replaceAll("<", "&lt;")}</pre></body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFlash(null);

    if ((password || confirmPassword) && password !== confirmPassword) {
      showFlash({ kind: "error", title: "Password mismatch", message: "Confirm password did not match." });
      return;
    }

    let updatedAvatarUrl = avatarUrl;

    // Upload if file selected
    if (avatarFile) {
      const formData = new FormData();
      formData.append("file", avatarFile);

      const uploadResponse = await fetch("/api/uploads", {
        method: "POST",
        body: formData
      });

      if (!uploadResponse.ok) {
        const data = await uploadResponse.json().catch(() => ({}));
        showFlash({ kind: "error", title: "Upload failed", message: data.error || "Failed to upload avatar." }, 6000);
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
        socials,
        hobbies,
        categories,
        password,
        confirmPassword
      })
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      showFlash({ kind: "error", title: "Update failed", message: data.error || "Failed to update profile." }, 6500);
      return;
    }

    const data = await response.json();
    const updatedUser: User | null = data.user ?? null;

    setUser(updatedUser);
    setAvatarUrl(updatedUser?.avatarUrl ?? updatedAvatarUrl);

    setPassword("");
    setConfirmPassword("");
    setAvatarFile(null);

    setSocials({
      facebook: updatedUser?.socials?.facebook ?? socials.facebook ?? "",
      x: updatedUser?.socials?.x ?? socials.x ?? "",
      instagram: updatedUser?.socials?.instagram ?? socials.instagram ?? "",
      youtube: updatedUser?.socials?.youtube ?? socials.youtube ?? "",
      github: updatedUser?.socials?.github ?? socials.github ?? "",
      website: updatedUser?.socials?.website ?? socials.website ?? ""
    });

    setHobbies(limit3(updatedUser?.hobbies ?? hobbies));
    setCategories(limit3(updatedUser?.categories ?? categories));

    showFlash({ kind: "success", title: "Profile updated", message: "Your changes were saved successfully." });
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
            {flash ? <FlashBanner flash={flash} onClose={() => setFlash(null)} /> : null}

            <div className={styles.actionBar}>
              <button
                className={cn(styles.btn, styles.primary)}
                type="button"
                onClick={() => router.push("/auth/login")}
              >
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
          {flash ? <FlashBanner flash={flash} onClose={() => setFlash(null)} /> : null}

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

              <div
                className={styles.avatarBadge}
                title="Change photo"
                onClick={pickPhoto}
                role="button"
                aria-label="Change photo"
              >
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
                <span>{bioCount}/260</span>
              </div>
            </div>

            {/* Social Links */}
            <div className={styles.sectionTitle}>
              <div>Social Links</div>
              <span>Optional</span>
            </div>

            <div className={styles.twoCols}>
              <div className={styles.field}>
                <div className={styles.label}>
                  <Facebook /> Facebook
                </div>
                <input
                  className={styles.input}
                  type="url"
                  placeholder="https://facebook.com/..."
                  value={socials.facebook ?? ""}
                  onChange={(e) => setSocials((p) => ({ ...p, facebook: e.target.value }))}
                />
              </div>

              <div className={styles.field}>
                <div className={styles.label}>
                  <Twitter /> X (Twitter)
                </div>
                <input
                  className={styles.input}
                  type="url"
                  placeholder="https://x.com/..."
                  value={socials.x ?? ""}
                  onChange={(e) => setSocials((p) => ({ ...p, x: e.target.value }))}
                />
              </div>
            </div>

            <div className={styles.twoCols}>
              <div className={styles.field}>
                <div className={styles.label}>
                  <Instagram /> Instagram
                </div>
                <input
                  className={styles.input}
                  type="url"
                  placeholder="https://instagram.com/..."
                  value={socials.instagram ?? ""}
                  onChange={(e) => setSocials((p) => ({ ...p, instagram: e.target.value }))}
                />
              </div>

              <div className={styles.field}>
                <div className={styles.label}>
                  <Youtube /> YouTube
                </div>
                <input
                  className={styles.input}
                  type="url"
                  placeholder="https://youtube.com/..."
                  value={socials.youtube ?? ""}
                  onChange={(e) => setSocials((p) => ({ ...p, youtube: e.target.value }))}
                />
              </div>
            </div>

            <div className={styles.twoCols}>
              <div className={styles.field}>
                <div className={styles.label}>
                  <Globe /> Website
                </div>
                <input
                  className={styles.input}
                  type="url"
                  placeholder="https://example.com"
                  value={socials.website ?? ""}
                  onChange={(e) => setSocials((p) => ({ ...p, website: e.target.value }))}
                />
              </div>

              <div className={styles.field}>
                <div className={styles.label}>
                  <Github /> GitHub
                </div>
                <input
                  className={styles.input}
                  type="url"
                  placeholder="https://github.com/..."
                  value={socials.github ?? ""}
                  onChange={(e) => setSocials((p) => ({ ...p, github: e.target.value }))}
                />
              </div>
            </div>

            {/* Hobbies */}
            <div className={styles.sectionTitle}>
              <div>Hobbies</div>
              <span>{hobbies.length}/3 selected</span>
            </div>

            <div className={styles.chipGrid} aria-label="Hobby template selection">
              {templates.hobbies.map((item) => {
                const selected = hobbies.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={cn(styles.pickChip, selected && styles.selected)}
                    onClick={() => togglePick("hobbies", item.id)}
                  >
                    {selected ? <Check /> : <Plus />}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className={styles.helpRow}>
              <span>Tap to select/deselect</span>
              <span />
            </div>

            {/* Categories */}
            <div className={styles.sectionTitle}>
              <div>Categories</div>
              <span>{categories.length}/3 selected</span>
            </div>

            <div className={styles.chipGrid} aria-label="Category template selection">
              {templates.categories.map((item) => {
                const selected = categories.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={cn(styles.pickChip, selected && styles.selected)}
                    onClick={() => togglePick("categories", item.id)}
                  >
                    {selected ? <Check /> : <Plus />}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className={styles.helpRow}>
              <span>Tap to select/deselect</span>
              <span />
            </div>

            {/* Password */}
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

            {/* Action bar */}
            <div className={styles.actionBar}>
              <button className={styles.btn} type="button" onClick={previewData}>
                <ExternalLink /> Preview
              </button>

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

function FlashBanner({ flash, onClose }: { flash: Flash; onClose: () => void }) {
  const isSuccess = flash.kind === "success";
  return (
    <div
      className={cn(styles.flash, isSuccess ? styles.flashSuccess : styles.flashError)}
      role="status"
      aria-live="polite"
    >
      <div className={styles.flashIcon}>{isSuccess ? <CheckCircle2 /> : <AlertTriangle />}</div>

      <div className={styles.flashBody}>
        <div className={styles.flashTitle}>{flash.title}</div>
        {flash.message ? <div className={styles.flashText}>{flash.message}</div> : null}
      </div>

      <button className={styles.flashClose} type="button" onClick={onClose} aria-label="Close message">
        <X />
      </button>
    </div>
  );
}
