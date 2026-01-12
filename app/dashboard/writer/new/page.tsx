"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "../../../../lib/categories";
import styles from "./new-post.module.css";

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
      <main className={styles.page}>
        <div className={styles.titleBlock}>
          <h1>Create new post</h1>
          <p>Admin accounts cannot create posts.</p>
        </div>
        <button className={styles.secondaryButton} onClick={() => router.push("/dashboard/admin")}>
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
    <main className={styles.page}>
      <div className={styles.headerRow}>
        <div className={styles.titleBlock}>
          <h1>Create new post</h1>
          <p>Write your post content and add TOC markers so the reader can navigate quickly.</p>
        </div>
        <div className={styles.instructions}>
          <h2>TOC formatting tips</h2>
          <ol>
            <li>Start each section with a TOC marker (example below).</li>
            <li>Keep the title inside angle brackets.</li>
            <li>Write your HTML or plain text after the marker.</li>
            <li>Optional intro: use <code>type: into &lt;Intro title&gt;</code> to add an intro section.</li>
          </ol>
          <div className={styles.tocHint}>
            <span>Example:</span>
            <code>type: toc &lt;Introduction&gt;</code>
            <code>&lt;h2&gt;Introduction&lt;/h2&gt;</code>
            <code>&lt;p&gt;Your content...&lt;/p&gt;</code>
          </div>
        </div>
      </div>

      {message ? <div className={styles.notice}>{message}</div> : null}
      {error ? <div className={`${styles.notice} ${styles.noticeError}`}>{error}</div> : null}

      <form className={styles.formCard} onSubmit={handleCreatePost}>
        <div className={styles.fieldGroup}>
          <label htmlFor="title">Title</label>
          <input
            id="title"
            className={styles.input}
            placeholder="Title"
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            required
          />
        </div>
        <div className={styles.fieldGroup}>
          <label htmlFor="excerpt">Excerpt</label>
          <input
            id="excerpt"
            className={styles.input}
            placeholder="Excerpt"
            value={form.excerpt}
            onChange={(event) => setForm({ ...form, excerpt: event.target.value })}
            required
          />
        </div>
        <div className={styles.fieldGroup}>
          <label htmlFor="category">Category</label>
          <select
            id="category"
            className={styles.select}
            value={form.category}
            onChange={(event) => setForm({ ...form, category: event.target.value })}
          >
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.fieldGroup}>
          <label htmlFor="latestThumb">Latest Thumbnail</label>
          <input
            id="latestThumb"
            className={styles.input}
            type="file"
            accept="image/*"
            onChange={(event) => setLatestThumbFile(event.target.files?.[0] ?? null)}
          />
          <div className={styles.helperText}>This image is used on latest listings.</div>
        </div>
        <div className={styles.fieldGroup}>
          <label htmlFor="trendingThumb">Trending Thumbnail</label>
          <input
            id="trendingThumb"
            className={styles.input}
            type="file"
            accept="image/*"
            onChange={(event) => setTrendingThumbFile(event.target.files?.[0] ?? null)}
          />
          <div className={styles.helperText}>This image appears in trending slots.</div>
        </div>
        <div className={styles.fieldGroup}>
          <label htmlFor="tags">Tags (comma separated)</label>
          <input
            id="tags"
            className={styles.input}
            placeholder="Tags (comma separated)"
            value={form.tags}
            onChange={(event) => setForm({ ...form, tags: event.target.value })}
          />
        </div>
        <div className={styles.fieldGroup}>
          <label htmlFor="content">Post content</label>
          <textarea
            id="content"
            className={styles.textarea}
            placeholder="Add content. Use 'type: toc <Section Title>' to define sections."
            rows={10}
            value={form.content}
            onChange={(event) => setForm({ ...form, content: event.target.value })}
            required
          />
          <div className={styles.helperRow}>
            <div className={styles.helperText}>You can write HTML or plain text.</div>
            <div className={styles.tocHint}>
              <span>Remember to use:</span>
              <code>type: toc &lt;Why Python?&gt;</code>
              <code>type: into &lt;Intro&gt;</code>
            </div>
          </div>
        </div>
        <div className={styles.actions}>
          <button className={styles.primaryButton} type="submit">
            Save draft
          </button>
          <button className={styles.secondaryButton} type="button" onClick={() => router.push("/dashboard/writer")}>
            Back
          </button>
        </div>
      </form>
    </main>
  );
}
