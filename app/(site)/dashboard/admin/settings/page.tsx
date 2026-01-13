"use client";

import { useEffect, useState } from "react";

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
      <main className="container">
        <p>Loading...</p>
      </main>
    );
  }

  return (
    <main className="container stack">
      <h1>Admin settings</h1>
      {message ? <div className="notice">{message}</div> : null}
      <div className="card stack">
        <label className="stack" style={{ gap: 4 }}>
          <span>Maintenance mode</span>
          <input
            type="checkbox"
            checked={settings.maintenanceMode}
            onChange={(event) =>
              handleSave({ ...settings, maintenanceMode: event.target.checked })
            }
          />
        </label>
        <label className="stack" style={{ gap: 4 }}>
          <span>Enable rate limits</span>
          <input
            type="checkbox"
            checked={settings.enableRateLimits}
            onChange={(event) =>
              handleSave({ ...settings, enableRateLimits: event.target.checked })
            }
          />
        </label>
        <label className="stack" style={{ gap: 4 }}>
          <span>Enable content filters</span>
          <input
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
