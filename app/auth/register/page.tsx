"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error || "Registration failed");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <main className="container stack">
      <h1>Create account</h1>
      <form className="card stack" onSubmit={handleSubmit}>
        {error ? <div className="notice">{error}</div> : null}
        <label className="stack" style={{ gap: 4 }}>
          Name
          <input
            className="input"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label className="stack" style={{ gap: 4 }}>
          Email
          <input
            className="input"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label className="stack" style={{ gap: 4 }}>
          Password
          <input
            className="input"
            type="password"
            minLength={8}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button className="button" type="submit">
          Register
        </button>
      </form>
    </main>
  );
}
