import { getSettings, saveSettings } from "@/lib/server/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await getSettings();
  const hasTavily = Boolean(settings.tavilyApiKey || process.env.TAVILY_API_KEY);
  const hasGoogle = Boolean((settings.googleApiKey || process.env.GOOGLE_API_KEY) && (settings.googleCx || process.env.GOOGLE_CX));

  return Response.json(
    {
      tavilyApiKeyConfigured: hasTavily,
      googleApiKeyConfigured: hasGoogle,
      webSearchConfigured: hasTavily || hasGoogle,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tavilyApiKey, googleApiKey, googleCx } = body ?? {};

    const updates: Record<string, string> = {};

    if (tavilyApiKey !== undefined) {
      updates.tavilyApiKey = typeof tavilyApiKey === "string" ? tavilyApiKey.trim() : "";
    }
    if (googleApiKey !== undefined) {
      updates.googleApiKey = typeof googleApiKey === "string" ? googleApiKey.trim() : "";
    }
    if (googleCx !== undefined) {
      updates.googleCx = typeof googleCx === "string" ? googleCx.trim() : "";
    }

    if (!Object.keys(updates).length) {
      return Response.json({ error: "No settings provided" }, { status: 400 });
    }

    await saveSettings(updates);

    return Response.json({ ok: true, message: "Settings saved successfully" });
  } catch {
    return Response.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
