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
  const [posts, setPosts] = useState<Post[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    content: "",
    excerpt: "",
    tags: ""
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [latestThumbFile, setLatestThumbFile] = useState<File | null>(null);
  const [trendingThumbFile, setTrendingThumbFile] = useState<File | null>(null);

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/me");
      if (!response.ok) return;
      const data = await response.json();
      if (!data.user) return;
      setUser(data.user);
      const postResponse = await fetch("/api/writer/posts");
      if (postResponse.ok) {
        const postData = await postResponse.json();
        setPosts(postData.posts ?? []);
      }
    }
    load();
  }, []);

  async function handleRequestWriter() {
    setMessage("");
    setError("");
    const response = await fetch("/api/writer/request", { method: "POST" });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error || "Request failed");
      return;
    }
    setMessage("Request submitted. Await admin approval.");
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
    let coverImageUrl: string | undefined;
    let thumbnailLatestUrl: string | undefined;
    let thumbnailTrendingUrl: string | undefined;
    try {
      coverImageUrl = await uploadFile(coverFile);
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
        coverImageUrl,
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
    const data = await response.json();
    setPosts((prev) => [data.post, ...prev]);
    setForm({ title: "", content: "", excerpt: "", tags: "" });
    setCoverFile(null);
    setLatestThumbFile(null);
    setTrendingThumbFile(null);
    setMessage("Draft created.");
  }

  async function handleSubmitPost(postId: string) {
    setMessage("");
    setError("");
    const response = await fetch(`/api/writer/posts/${postId}/submit`, {
      method: "POST"
    });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error || "Failed to submit");
      return;
    }
    const data = await response.json();
    setPosts((prev) => prev.map((post) => (post.id === postId ? data.post : post)));
    setMessage("Post submitted for review.");
  }

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
      {user.role === "user" ? (
        <div className="card stack">
          <p>You are not a writer yet.</p>
          <button className="button" onClick={handleRequestWriter}>
            Request writer access
          </button>
        </div>
      ) : null}
      {user.role === "writer" || user.role === "admin" ? (
        <>
          <form className="card stack" onSubmit={handleCreatePost}>
            <h2>Create draft</h2>
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
              Cover Image
              <input
                className="input"
                type="file"
                accept="image/*"
                onChange={(event) => setCoverFile(event.target.files?.[0] ?? null)}
              />
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
          <div className="card stack">
            <h2>Your posts</h2>
            {posts.length === 0 ? (
              <p>No posts yet.</p>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Review note</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => (
                    <tr key={post.id}>
                      <td>{post.title}</td>
                      <td>{post.status}</td>
                      <td>{post.reviewNote ?? "-"}</td>
                      <td>
                        {post.status === "draft" ? (
                          <button
                            className="button secondary"
                            onClick={() => handleSubmitPost(post.id)}
                          >
                            Submit
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : null}
      <button className="button secondary" onClick={() => router.push("/dashboard")}
      >
        Back to dashboard
      </button>
    </main>
  );
}
