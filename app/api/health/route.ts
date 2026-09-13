export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(
    {
      ok: true,
      service: "OMEN OSINT backend",
      version: "4.0",
      webSearch: Boolean(process.env.TAVILY_API_KEY),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
