import { ndjsonStream, postJson } from "@/lib/server/net";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type WriteFn = (event: Record<string, unknown>) => void;

function makeWebSearchQueries(input: string): string[] {
  const q = input.trim();
  const queries: string[] = [];
  const add = (x: string) => {
    if (x && !queries.includes(x)) queries.push(x);
  };
  const exact = q.replace(/"/g, "").trim();
  add('"' + exact + '"');
  add(q);
  if (/^[A-Za-z0-9._-]+$/.test(q)) {
    const normalized = q.replace(/[._-]+/g, " ").trim();
    if (normalized && normalized !== q) add('"' + normalized + '"');
    add("@" + q.replace(/^@+/, ""));
  }
  return queries.slice(0, 4);
}

async function tavilySearch(q: string, apiKey: string, maxResults = 20) {
  return postJson(
    "https://api.tavily.com/search",
    {
      query: q,
      topic: "general",
      search_depth: "basic",
      max_results: Math.min(20, Math.max(1, maxResults)),
      include_answer: false,
      include_raw_content: false,
      include_images: false,
    },
    20000,
    { Authorization: `Bearer ${apiKey}` },
  );
}

async function runWebSearch(input: string, write: WriteFn) {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    write({
      type: "search_error",
      error:
        "TAVILY_API_KEY is not set. Add it in Settings or the project environment before running a public web search.",
    });
    write({ type: "done" });
    return;
  }

  const queries = makeWebSearchQueries(input);
  const seen = new Set<string>();
  write({ type: "search_start", input, provider: "Tavily", query_count: queries.length });

  const tasks = queries.map(async (q, index) => {
    write({ type: "query", index: index + 1, total: queries.length, q });
    const r = await tavilySearch(q, apiKey, 20);
    if (r.error) {
      write({ type: "search_error", query: q, error: r.error });
      return;
    }
    if (!r.ok) {
      const d = r.data as Record<string, string> | null;
      const detail =
        d?.detail || d?.error || d?.message || `Tavily returned HTTP ${r.status}`;
      write({ type: "search_error", query: q, http: r.status, error: detail });
      return;
    }
    const payload = r.data as { results?: unknown[] } | null;
    const results = Array.isArray(payload?.results) ? payload!.results : [];
    let emitted = 0;
    for (const raw of results) {
      const item = raw as Record<string, unknown>;
      const url = String(item?.url || "").trim();
      if (!url || seen.has(url)) continue;
      seen.add(url);
      emitted++;
      write({
        type: "result",
        query: q,
        title: String(item?.title || "Untitled result"),
        url,
        description: String(item?.content || ""),
        score: typeof item?.score === "number" ? item.score : null,
        publishedAt: (item?.published_date as string) || null,
      });
    }
    write({ type: "query_done", query: q, returned: results.length, emitted });
  });

  await Promise.allSettled(tasks);
  write({ type: "done", count: seen.size });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  if (!q || q.length > 400) {
    return Response.json(
      { error: "Search query must be 1-400 characters." },
      { status: 400 },
    );
  }
  return ndjsonStream((write) => runWebSearch(q, write));
}
