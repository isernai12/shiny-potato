"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error || "Login failed");
      return;
    }
    router.push("/dashboard");
  }

  return (
    <main className="container stack">
      <h1>Login</h1>
      <form className="card stack" onSubmit={handleSubmit}>
        {error ? <div className="notice">{error}</div> : null}
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
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        <button className="button" type="submit">
          Log in
        </button>
      </form>
    </main>
  );
}
