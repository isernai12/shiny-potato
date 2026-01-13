"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";
import { LogIn, Mail, Lock, UserPlus } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // dark mode sync (Header html.dark টগল করে)
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const sync = () => setIsDark(document.documentElement.classList.contains("dark"));
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, remember })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || "Login failed");
        return;
      }

      router.push("/dashboard");
    } catch {
      setError("Network error. আবার চেষ্টা করো।");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className={`${styles.authScope} ${isDark ? styles.dark : ""}`}>
      <div className={styles.wrap}>
        <section className={styles.authCard} aria-label="Login form">
          <div className={styles.authHead}>
            <div className={styles.authTitle}>
              <LogIn className={styles.icon16} /> Login
            </div>

            <a className={styles.link} href="/auth/register">
              Sign Up
            </a>
          </div>

          <form className={styles.authBody} onSubmit={handleSubmit}>
            {error ? <div className={styles.notice}>{error}</div> : null}

            <div className={styles.field}>
              <div className={styles.label}>
                <Mail className={styles.icon16} /> Email
              </div>
              <input
                className={styles.input}
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <div className={styles.label}>
                <Lock className={styles.icon16} /> Password
              </div>
              <input
                className={styles.input}
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className={styles.row}>
              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span>Remember me</span>
              </label>

              {/* ডেমো লিংক, পরে তুমি route add করবে */}
              <a className={styles.link} href="/auth/forgot">
                Forgot password?
              </a>
            </div>

            <div className={styles.btnRow}>
              <button
                className={`${styles.btn} ${styles.primary}`}
                type="submit"
                disabled={loading}
              >
                <LogIn className={styles.icon16} />
                {loading ? "Logging in..." : "Login"}
              </button>

              <a className={styles.btn} href="/auth/register" aria-label="Create account">
                <UserPlus className={styles.icon16} /> Create account
              </a>
            </div>

            <div className={styles.miniNote}>
              পরে চাইলে Forgot password page add করবে। এখন UI match করা হলো।
            </div>

            {/* ✅ Social buttons বাদ (তোমার নির্দেশ অনুযায়ী) */}
          </form>
        </section>
      </div>
    </main>
  );
}
