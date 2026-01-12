"use client";

import { useEffect, useState } from "react";
import styles from "./stats.module.css";

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
    <main className={styles.page}>
      <h1 className={styles.title}>Status of site</h1>
      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Last 24h</h2>
        <p className={styles.statValue}>{stats?.last24hViews ?? 0} views</p>
        <p className={styles.statHint}>Traffic in the last 24 hours.</p>
        <p className={styles.statValue}>Top page: {stats?.topPage ?? "/"}</p>
        <p className={styles.statHint}>Most visited content today.</p>
        <p className={styles.statValue}>
          Avg time on site: {Math.round(stats?.avgSessionSeconds ?? 0)}s
        </p>
        <p className={styles.statHint}>Average session duration.</p>
        <p className={styles.statValue}>Bounce rate: {(stats?.bounceRate ?? 0).toFixed(1)}%</p>
        <p className={styles.statHint}>High bounce may indicate slow UI or poor targeting.</p>
        <p className={styles.statValue}>Errors (today): {stats?.errorsToday ?? 0}</p>
        <p className={styles.statHint}>Server/app errors counted today.</p>
        <p className={styles.statValue}>Uptime: {(stats?.uptimeSeconds ?? 0).toFixed(0)}s</p>
      </div>
      <div className={styles.card}>
        <h2 className={styles.sectionTitle}>Totals</h2>
        <p className={styles.statValue}>Total views: {stats?.totalViews ?? 0}</p>
        <p className={styles.statValue}>Unique visitors: {stats?.uniqueVisitors ?? 0}</p>
        <p className={styles.statValue}>
          Engagement rate: {(stats?.engagementRate ?? 0).toFixed(1)}%
        </p>
      </div>
    </main>
  );
}
