import fs from "node:fs/promises";
import path from "node:path";

const SETTINGS_PATH = path.join(process.cwd(), ".omen-settings.json");

export type OmenSettings = {
  tavilyApiKey?: string;
};

export async function getSettings(): Promise<OmenSettings> {
  try {
    const content = await fs.readFile(SETTINGS_PATH, "utf-8");
    return JSON.parse(content);
  } catch {
    return {};
  }
}

export async function saveSettings(settings: Partial<OmenSettings>) {
  const current = await getSettings();
  const updated = { ...current, ...settings };
  await fs.writeFile(SETTINGS_PATH, JSON.stringify(updated, null, 2), "utf-8");
}

export async function getTavilyKey(): Promise<string | undefined> {
  // Priority: 1. Environment Variable, 2. Settings File
  if (process.env.TAVILY_API_KEY) {
    return process.env.TAVILY_API_KEY;
  }
  const settings = await getSettings();
  return settings.tavilyApiKey;
}
