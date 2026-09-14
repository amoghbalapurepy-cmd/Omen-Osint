import { getGoogleKeys, getTavilyKey } from "@/lib/server/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const tavilyKey = await getTavilyKey();
  const { apiKey: googleApiKey, cx: googleCx } = await getGoogleKeys();

  return Response.json(
    {
      ok: true,
      service: "OMEN OSINT backend",
      version: "4.0",
      webSearch: Boolean(tavilyKey || (googleApiKey && googleCx)),
      providers: {
        tavily: Boolean(tavilyKey),
        google: Boolean(googleApiKey && googleCx),
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
