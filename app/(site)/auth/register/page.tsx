"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./register.module.css";
import {
  UserPlus,
  BadgeCheck,
  Mail,
  Lock,
  ShieldCheck,
  LogIn
} from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Dark mode sync: তোমার Header html এ "dark" class টগল করে।
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const sync = () => setIsDark(document.documentElement.classList.contains("dark"));
    sync();
    // optional: theme toggle হলে সাথে সাথে ধরতে
    const obs = new MutationObserver(sync);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Confirm password মিলছে না।");
      return;
    }
    if (!acceptTerms) {
      setError("Terms & Privacy accept করতে হবে।");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password, confirmPassword })
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || "Registration failed");
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
        <section className={styles.authCard} aria-label="Sign up form">
          <div className={styles.authHead}>
            <div className={styles.authTitle}>
              <UserPlus className={styles.icon16} />
              Sign Up
            </div>

            <a className={styles.link} href="/auth/login">
              Login
            </a>
          </div>

          <form className={styles.authBody} onSubmit={handleSubmit}>
            {error ? <div className={styles.notice}>{error}</div> : null}

            <div className={styles.field}>
              <div className={styles.label}>
                <BadgeCheck className={styles.icon16} /> Full Name
              </div>
              <input
                className={styles.input}
                type="text"
                placeholder="Your name"
                autoComplete="name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

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
                placeholder="Create password"
                autoComplete="new-password"
                minLength={8}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <div className={styles.label}>
                <ShieldCheck className={styles.icon16} /> Confirm Password
              </div>
              <input
                className={styles.input}
                type="password"
                placeholder="Confirm password"
                autoComplete="new-password"
                minLength={8}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <div className={styles.row}>
              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                />
                <span>
                  I agree to the{" "}
                  <a className={styles.link} href="/terms">
                    Terms
                  </a>{" "}
                  &amp;{" "}
                  <a className={styles.link} href="/privacy">
                    Privacy
                  </a>
                  .
                </span>
              </label>
            </div>

            <div className={styles.btnRow}>
              <button className={`${styles.btn} ${styles.primary}`} type="submit" disabled={loading}>
                <UserPlus className={styles.icon16} />
                {loading ? "Creating..." : "Create Account"}
              </button>

              <a className={styles.btn} href="/auth/login" aria-label="Go to login">
                <LogIn className={styles.icon16} /> Go to Login
              </a>
            </div>

            <div className={styles.miniNote}>
              Password কমপক্ষে 8 অক্ষর। Terms &amp; Privacy accept করা লাগবে।
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
