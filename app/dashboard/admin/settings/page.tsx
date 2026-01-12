"use client";

import { useEffect, useState } from "react";
import styles from "./settings.module.css";

type Settings = {
  maintenanceMode: boolean;
  enableRateLimits: boolean;
  enableContentFilters: boolean;
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/admin/settings");
      if (!response.ok) return;
      const data = await response.json();
      setSettings(data.settings);
    }
    load();
  }, []);

  async function handleSave(next: Settings) {
    const response = await fetch("/api/admin/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next)
    });
    if (response.ok) {
      setMessage("Settings updated.");
      setSettings(next);
    }
  }

  if (!settings) {
    return (
      <main className={styles.page}>
        <p className={styles.muted}>Loading...</p>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <h1 className={styles.title}>Admin settings</h1>
      {message ? <div className={styles.notice}>{message}</div> : null}
      <div className={styles.card}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Maintenance mode</span>
          <input
            className={styles.checkbox}
            type="checkbox"
            checked={settings.maintenanceMode}
            onChange={(event) =>
              handleSave({ ...settings, maintenanceMode: event.target.checked })
            }
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Enable rate limits</span>
          <input
            className={styles.checkbox}
            type="checkbox"
            checked={settings.enableRateLimits}
            onChange={(event) =>
              handleSave({ ...settings, enableRateLimits: event.target.checked })
            }
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Enable content filters</span>
          <input
            className={styles.checkbox}
            type="checkbox"
            checked={settings.enableContentFilters}
            onChange={(event) =>
              handleSave({ ...settings, enableContentFilters: event.target.checked })
            }
          />
        </label>
      </div>
    </main>
  );
}
