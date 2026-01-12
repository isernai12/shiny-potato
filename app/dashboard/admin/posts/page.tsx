"use client";

import { useEffect, useState } from "react";

type Post = {
  id: string;
  title: string;
  slug: string;
  status: string;
  authorUserId: string;
};

export default function AdminPostReviewPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [note, setNote] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");

  async function load() {
    const response = await fetch("/api/admin/posts/submitted");
    if (!response.ok) return;
    const data = await response.json();
    setPosts(data.posts ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleApprove(id: string) {
    await fetch(`/api/admin/posts/${id}/approve`, { method: "POST" });
    setMessage("Post approved.");
    load();
  }

  async function handleReject(id: string) {
    await fetch(`/api/admin/posts/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: note[id] || "" })
    });
    setMessage("Post rejected.");
    load();
  }

  return (
    <main className="container stack">
      <h1>Post review</h1>
      {message ? <div className="notice">{message}</div> : null}
      <div className="card stack">
        {posts.length === 0 ? (
          <p>No pending posts.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Preview</th>
                <th>Note</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id}>
                  <td>{post.title}</td>
                  <td>{post.authorUserId}</td>
                  <td>
                    <a className="button secondary" href={`/post/${post.slug}`}>
                      Preview
                    </a>
                  </td>
                  <td>
                    <input
                      className="input"
                      value={note[post.id] || ""}
                      onChange={(event) =>
                        setNote((prev) => ({ ...prev, [post.id]: event.target.value }))
                      }
                    />
                  </td>
                  <td>
                    <div className="stack" style={{ gap: 8 }}>
                      <button className="button secondary" onClick={() => handleApprove(post.id)}>
                        Approve
                      </button>
                      <button className="button secondary" onClick={() => handleReject(post.id)}>
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}
