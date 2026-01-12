import { readDataFile, writeDataFile } from "../jsonDb";

type Settings = {
  maintenanceMode: boolean;
  enableRateLimits: boolean;
  enableContentFilters: boolean;
};

const SETTINGS_FILE = "settings.json";

function defaultSettings(): Settings {
  return {
    maintenanceMode: false,
    enableRateLimits: true,
    enableContentFilters: false
  };
}

export async function readSettings() {
  const data = await readDataFile<Settings>(SETTINGS_FILE);
  if (data.records.length === 0) {
    const settings = defaultSettings();
    await writeDataFile(SETTINGS_FILE, { version: 1, records: [settings] });
    return settings;
  }
  return data.records[0];
}

export async function writeSettings(settings: Settings) {
  await writeDataFile(SETTINGS_FILE, { version: 1, records: [settings] });
}
