"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName, email, password, confirmPassword })
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
          Full Name
          <input
            className="input"
            required
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
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
        <label className="stack" style={{ gap: 4 }}>
          Confirm Password
          <input
            className="input"
            type="password"
            minLength={8}
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
        </label>
        <button className="button" type="submit">
          Register
        </button>
      </form>
    </main>
  );
}
