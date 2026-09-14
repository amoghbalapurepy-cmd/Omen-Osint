import { getSettings, saveSettings } from "@/lib/server/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await getSettings();
  // Do NOT return the API key to the client for security reasons.
  // Just return whether it is configured.
  return Response.json({
    tavilyApiKeyConfigured: Boolean(settings.tavilyApiKey),
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tavilyApiKey } = body;

    if (tavilyApiKey === undefined) {
      return Response.json({ error: "Missing tavilyApiKey in request body" }, { status: 400 });
    }

    await saveSettings({ tavilyApiKey });

    return Response.json({ ok: true, message: "Settings saved successfully" });
  } catch (e) {
    return Response.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
