import { readDataFile, writeDataFile } from "../jsonDb";
import { SiteStats } from "../types";

const STATS_FILE = "siteStats.json";

function defaultStats(): SiteStats {
  return {
    totalViews: 0,
    uniqueVisitors: 0,
    last24hViews: 0,
    topPage: "/",
    avgSessionSeconds: 0,
    bounceRate: 0,
    errorsToday: 0,
    uptimeSeconds: 0,
    engagementRate: 0
  };
}

export async function readSiteStats() {
  const data = await readDataFile<SiteStats>(STATS_FILE);
  if (data.records.length === 0) {
    const stats = defaultStats();
    await writeDataFile(STATS_FILE, { version: 1, records: [stats] });
    return stats;
  }
  return data.records[0];
}

export async function writeSiteStats(stats: SiteStats) {
  await writeDataFile(STATS_FILE, { version: 1, records: [stats] });
}
