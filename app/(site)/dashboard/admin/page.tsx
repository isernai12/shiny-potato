"use client";

import Link from "next/link";
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

type PendingCounts = {
  pendingPosts: number;
  pendingCommentReports: number;
  pendingPostReports: number;
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [counts, setCounts] = useState<PendingCounts>({
    pendingPosts: 0,
    pendingCommentReports: 0,
    pendingPostReports: 0
  });

  useEffect(() => {
    async function load() {
      const statsRes = await fetch("/api/admin/stats");
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
      }
      const [postsRes, commentRes, postRes] = await Promise.all([
        fetch("/api/admin/posts/submitted"),
        fetch("/api/admin/reports/comments"),
        fetch("/api/admin/reports/posts")
      ]);
      const pendingPosts = postsRes.ok ? (await postsRes.json()).posts.length : 0;
      const pendingCommentReports = commentRes.ok
        ? (await commentRes.json()).reports.filter((r: { status: string }) => r.status === "pending").length
        : 0;
      const pendingPostReports = postRes.ok
        ? (await postRes.json()).reports.filter((r: { status: string }) => r.status === "pending").length
        : 0;
      setCounts({ pendingPosts, pendingCommentReports, pendingPostReports });
    }
    load();
  }, []);

  return (
    <main className="container stack">
      <h1>Admin dashboard</h1>
      <div className="grid two">
        <div className="card stack">
          <h2>Status of site</h2>
          <p>Total views: {stats?.totalViews ?? 0}</p>
          <p>Unique visitors: {stats?.uniqueVisitors ?? 0}</p>
          <p>Uptime: {stats?.uptimeSeconds ?? 0}s</p>
          <Link className="button secondary" href="/dashboard/admin/stats">
            View details
          </Link>
        </div>
        <div className="card stack">
          <h2>Post review</h2>
          <p>Pending posts: {counts.pendingPosts}</p>
          <Link className="button secondary" href="/dashboard/admin/posts">
            Review posts
          </Link>
        </div>
        <div className="card stack">
          <h2>Comment reports</h2>
          <p>Pending reports: {counts.pendingCommentReports}</p>
          <Link className="button secondary" href="/dashboard/admin/reports/comments">
            Review comments
          </Link>
        </div>
        <div className="card stack">
          <h2>Post reports</h2>
          <p>Pending reports: {counts.pendingPostReports}</p>
          <Link className="button secondary" href="/dashboard/admin/reports/posts">
            Review posts
          </Link>
        </div>
      </div>
      <div className="grid two">
        <Link className="button secondary" href="/dashboard/admin/users">
          User management
        </Link>
        <Link className="button secondary" href="/dashboard/admin/audit">
          Audit log
        </Link>
        <Link className="button secondary" href="/dashboard/admin/settings">
          Admin settings
        </Link>
      </div>
    </main>
  );
}
