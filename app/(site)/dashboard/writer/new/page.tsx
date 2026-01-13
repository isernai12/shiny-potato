"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "../../../../../lib/categories";

export default function NewPostPage() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    excerpt: "",
    category: CATEGORIES[0] ?? "",
    tags: ""
  });
  const [latestThumbFile, setLatestThumbFile] = useState<File | null>(null);
  const [trendingThumbFile, setTrendingThumbFile] = useState<File | null>(null);

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/me");
      if (!response.ok) return;
      const data = await response.json();
      setIsAdmin(data.user?.role === "admin");
    }
    load();
  }, []);

  if (isAdmin) {
    return (
      <main className="container stack">
        <h1>Create new post</h1>
        <p>Admin accounts cannot create posts.</p>
        <button className="button secondary" onClick={() => router.push("/dashboard/admin")}>
          Go to admin dashboard
        </button>
      </main>
    );
  }

  async function handleCreatePost(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    setError("");

    async function uploadFile(file: File | null) {
      if (!file) return undefined;
      const formData = new FormData();
      formData.append("file", file);
      const uploadResponse = await fetch("/api/uploads", {
        method: "POST",
        body: formData
      });
      if (!uploadResponse.ok) {
        const data = await uploadResponse.json();
        throw new Error(data.error || "Upload failed");
      }
      const data = await uploadResponse.json();
      return data.url as string;
    }

    let thumbnailLatestUrl: string | undefined;
    let thumbnailTrendingUrl: string | undefined;
    try {
      thumbnailLatestUrl = await uploadFile(latestThumbFile);
      thumbnailTrendingUrl = await uploadFile(trendingThumbFile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      return;
    }

    const response = await fetch("/api/writer/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        content: form.content,
        excerpt: form.excerpt,
        category: form.category,
        thumbnailLatestUrl,
        thumbnailTrendingUrl,
        tags: form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      })
    });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error || "Failed to create post");
      return;
    }
    setForm({ title: "", content: "", excerpt: "", category: CATEGORIES[0] ?? "", tags: "" });
    setLatestThumbFile(null);
    setTrendingThumbFile(null);
    setMessage("Draft created.");
  }

  return (
    <main className="container stack">
      <h1>Create new post</h1>
      {message ? <div className="notice">{message}</div> : null}
      {error ? <div className="notice">{error}</div> : null}
      <form className="card stack" onSubmit={handleCreatePost}>
        <input
          className="input"
          placeholder="Title"
          value={form.title}
          onChange={(event) => setForm({ ...form, title: event.target.value })}
          required
        />
        <input
          className="input"
          placeholder="Excerpt"
          value={form.excerpt}
          onChange={(event) => setForm({ ...form, excerpt: event.target.value })}
          required
        />
        <label className="stack" style={{ gap: 4 }}>
          Category
          <select
            className="select"
            value={form.category}
            onChange={(event) => setForm({ ...form, category: event.target.value })}
          >
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </label>
        <label className="stack" style={{ gap: 4 }}>
          Latest Thumbnail
          <input
            className="input"
            type="file"
            accept="image/*"
            onChange={(event) => setLatestThumbFile(event.target.files?.[0] ?? null)}
          />
        </label>
        <label className="stack" style={{ gap: 4 }}>
          Trending Thumbnail
          <input
            className="input"
            type="file"
            accept="image/*"
            onChange={(event) => setTrendingThumbFile(event.target.files?.[0] ?? null)}
          />
        </label>
        <input
          className="input"
          placeholder="Tags (comma separated)"
          value={form.tags}
          onChange={(event) => setForm({ ...form, tags: event.target.value })}
        />
        <textarea
          className="textarea"
          placeholder="Markdown content"
          rows={8}
          value={form.content}
          onChange={(event) => setForm({ ...form, content: event.target.value })}
          required
        />
        <button className="button" type="submit">
          Save draft
        </button>
      </form>
      <button className="button secondary" onClick={() => router.push("/dashboard/writer")}
      >
        Back
      </button>
    </main>
  );
}
