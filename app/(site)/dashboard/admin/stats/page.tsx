"use client";

import { useEffect, useState } from "react";

type Stats = {
  totalViews: number;
  uniqueVisitors: number;
  last24hViews: number;
  topPage: string;
  avgSessionSeconds: number;
  bounceRate: number;
  errorsToday: number;
  uptimeSeconds: number;
  engagementRate: number;
};

export default function AdminStatsPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/admin/stats");
      if (!response.ok) return;
      const data = await response.json();
      setStats(data.stats);
    }
    load();
  }, []);

  return (
    <main className="container stack">
      <h1>Status of site</h1>
      <div className="card stack">
        <h2>Last 24h</h2>
        <p>{stats?.last24hViews ?? 0} views</p>
        <p>Traffic in the last 24 hours.</p>
        <p>Top page: {stats?.topPage ?? "/"}</p>
        <p>Most visited content today.</p>
        <p>Avg time on site: {Math.round(stats?.avgSessionSeconds ?? 0)}s</p>
        <p>Average session duration.</p>
        <p>Bounce rate: {(stats?.bounceRate ?? 0).toFixed(1)}%</p>
        <p>High bounce may indicate slow UI or poor targeting.</p>
        <p>Errors (today): {stats?.errorsToday ?? 0}</p>
        <p>Server/app errors counted today.</p>
        <p>Uptime: {(stats?.uptimeSeconds ?? 0).toFixed(0)}s</p>
      </div>
      <div className="card stack">
        <h2>Totals</h2>
        <p>Total views: {stats?.totalViews ?? 0}</p>
        <p>Unique visitors: {stats?.uniqueVisitors ?? 0}</p>
        <p>Engagement rate: {(stats?.engagementRate ?? 0).toFixed(1)}%</p>
      </div>
    </main>
  );
}
