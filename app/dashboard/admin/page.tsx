"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type WriterRequest = {
  id: string;
  userId: string;
  status: string;
  createdAt: string;
};

type Post = {
  id: string;
  title: string;
  status: string;
  authorUserId: string;
  reviewNote?: string;
};

export default function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [requests, setRequests] = useState<WriterRequest[]>([]);
  const [submittedPosts, setSubmittedPosts] = useState<Post[]>([]);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [note, setNote] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user"
  });

  async function load() {
    const [usersRes, reqRes, postsRes, allPostsRes] = await Promise.all([
      fetch("/api/admin/users"),
      fetch("/api/admin/writer-requests"),
      fetch("/api/admin/posts/submitted"),
      fetch("/api/admin/posts")
    ]);
    if (usersRes.ok) {
      const data = await usersRes.json();
      setUsers(data.users ?? []);
    }
    if (reqRes.ok) {
      const data = await reqRes.json();
      setRequests(data.requests ?? []);
    }
    if (postsRes.ok) {
      const data = await postsRes.json();
      setSubmittedPosts(data.posts ?? []);
    }
    if (allPostsRes.ok) {
      const data = await allPostsRes.json();
      setAllPosts(data.posts ?? []);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleApproveRequest(id: string) {
    setMessage("");
    setError("");
    const response = await fetch(`/api/admin/writer-requests/${id}/approve`, {
      method: "POST"
    });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error || "Failed to approve request");
      return;
    }
    setMessage("Writer request approved.");
    load();
  }

  async function handleRejectRequest(id: string) {
    setMessage("");
    setError("");
    const response = await fetch(`/api/admin/writer-requests/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: note[id] || "" })
    });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error || "Failed to reject request");
      return;
    }
    setMessage("Writer request rejected.");
    load();
  }

  async function handleApprovePost(id: string) {
    setMessage("");
    setError("");
    const response = await fetch(`/api/admin/posts/${id}/approve`, {
      method: "POST"
    });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error || "Failed to approve post");
      return;
    }
    setMessage("Post approved.");
    load();
  }

  async function handleRejectPost(id: string) {
    setMessage("");
    setError("");
    const response = await fetch(`/api/admin/posts/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: note[id] || "" })
    });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error || "Failed to reject post");
      return;
    }
    setMessage("Post rejected.");
    load();
  }

  async function handleCreateUser(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    setError("");
    const response = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userForm)
    });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error || "Failed to create user");
      return;
    }
    setMessage("User created.");
    setUserForm({ name: "", email: "", password: "", role: "user" });
    load();
  }

  return (
    <main className="container stack">
      <h1>Admin tools</h1>
      {message ? <div className="notice">{message}</div> : null}
      {error ? <div className="notice">{error}</div> : null}
      <section className="card stack">
        <h2>Create user</h2>
        <form className="stack" onSubmit={handleCreateUser}>
          <input
            className="input"
            placeholder="Name"
            value={userForm.name}
            onChange={(event) =>
              setUserForm((prev) => ({ ...prev, name: event.target.value }))
            }
            required
          />
          <input
            className="input"
            placeholder="Email"
            type="email"
            value={userForm.email}
            onChange={(event) =>
              setUserForm((prev) => ({ ...prev, email: event.target.value }))
            }
            required
          />
          <input
            className="input"
            placeholder="Password"
            type="password"
            minLength={8}
            value={userForm.password}
            onChange={(event) =>
              setUserForm((prev) => ({ ...prev, password: event.target.value }))
            }
            required
          />
          <select
            className="select"
            value={userForm.role}
            onChange={(event) =>
              setUserForm((prev) => ({ ...prev, role: event.target.value }))
            }
          >
            <option value="user">user</option>
            <option value="writer">writer</option>
            <option value="admin">admin</option>
          </select>
          <button className="button" type="submit">
            Create user
          </button>
        </form>
      </section>
      <section className="card stack">
        <h2>Users</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="card stack">
        <h2>Writer requests</h2>
        {requests.length === 0 ? (
          <p>No pending requests.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Requested</th>
                <th>Note</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id}>
                  <td>{request.userId}</td>
                  <td>{new Date(request.createdAt).toLocaleString()}</td>
                  <td>
                    <input
                      className="input"
                      value={note[request.id] || ""}
                      onChange={(event) =>
                        setNote((prev) => ({
                          ...prev,
                          [request.id]: event.target.value
                        }))
                      }
                      placeholder="Optional note"
                    />
                  </td>
                  <td>
                    <div className="stack" style={{ gap: 8 }}>
                      <button
                        className="button secondary"
                        onClick={() => handleApproveRequest(request.id)}
                      >
                        Approve
                      </button>
                      <button
                        className="button secondary"
                        onClick={() => handleRejectRequest(request.id)}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      <section className="card stack">
        <h2>Submitted posts</h2>
        {submittedPosts.length === 0 ? (
          <p>No submitted posts.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Author</th>
                <th>Note</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {submittedPosts.map((post) => (
                <tr key={post.id}>
                  <td>{post.title}</td>
                  <td>{post.authorUserId}</td>
                  <td>
                    <input
                      className="input"
                      value={note[post.id] || ""}
                      onChange={(event) =>
                        setNote((prev) => ({
                          ...prev,
                          [post.id]: event.target.value
                        }))
                      }
                      placeholder="Optional feedback"
                    />
                  </td>
                  <td>
                    <div className="stack" style={{ gap: 8 }}>
                      <button
                        className="button secondary"
                        onClick={() => handleApprovePost(post.id)}
                      >
                        Approve
                      </button>
                      <button
                        className="button secondary"
                        onClick={() => handleRejectPost(post.id)}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      <section className="card stack">
        <h2>All posts</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Author</th>
            </tr>
          </thead>
          <tbody>
            {allPosts.map((post) => (
              <tr key={post.id}>
                <td>{post.title}</td>
                <td>{post.status}</td>
                <td>{post.authorUserId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <button className="button secondary" onClick={() => router.push("/dashboard")}
      >
        Back to dashboard
      </button>
    </main>
  );
}
