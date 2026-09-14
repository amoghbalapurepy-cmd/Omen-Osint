import { getTavilyKey } from "@/lib/server/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const tavilyKey = await getTavilyKey();
  return Response.json(
    {
      ok: true,
      service: "OMEN OSINT backend",
      version: "4.0",
      webSearch: Boolean(tavilyKey),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
