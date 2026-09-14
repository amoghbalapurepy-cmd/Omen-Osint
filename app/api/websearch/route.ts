import { ndjsonStream, postJson, getJson } from "@/lib/server/net";
import { getTavilyKey, getGoogleKeys } from "@/lib/server/settings";

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

  add(`"${exact}"`);
  add(q);

  if (/^[A-Za-z0-9._-]+$/.test(q)) {
    const normalized = q.replace(/[._-]+/g, " ").trim();
    if (normalized && normalized !== q) {
      add(`"${normalized}"`);
    }
    add("@" + q.replace(/^@+/, ""));
  }

  return queries.slice(0, 3);
}

async function tavilySearch(q: string, apiKey: string, maxResults = 10) {
  return postJson(
    "https://api.tavily.com/search",
    {
      api_key: apiKey,
      query: q,
      topic: "general",
      search_depth: "basic",
      max_results: Math.min(10, Math.max(1, maxResults)),
      include_answer: false,
      include_raw_content: false,
      include_images: false,
    },
    20000,
    {},
  );
}

async function googleSearch(q: string, apiKey: string, cx: string, maxResults = 10) {
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(q)}&num=${Math.min(10, Math.max(1, maxResults))}`;
  return getJson(url);
}

function providerErrorCode(status?: number): string {
  if (status === 429) return "PROVIDER_RATE_LIMITED";
  if (status !== undefined && status >= 500) return "UPSTREAM_ERROR";
  if (status === 401 || status === 403) return "INVALID_PROVIDER_CREDENTIAL";
  return "PROVIDER_ERROR";
}

async function runWebSearch(input: string, write: WriteFn) {
  const tavilyKey = await getTavilyKey();
  const { apiKey: googleKey, cx: googleCx } = await getGoogleKeys();

  if (!tavilyKey && (!googleKey || !googleCx)) {
    write({
      type: "search_error",
      error: "No valid search credentials (Tavily or Google) configured.",
      code: "PROVIDER_NOT_CONFIGURED",
    });
    write({ type: "done" });
    return;
  }

  const queries = makeWebSearchQueries(input);
  const seen = new Set<string>();

  write({
    type: "search_start",
    input,
    provider: "Multi-Engine",
    query_count: queries.length,
  });

  const tasks = queries.map(async (q, index) => {
    write({
      type: "query",
      index: index + 1,
      total: queries.length,
      q,
    });

    const results: { title: string; url: string; description: string; score?: number; publishedAt?: string }[] = [];

    // 1. Try Tavily
    if (tavilyKey) {
      const tr = await tavilySearch(q, tavilyKey);
      if (tr.ok && Array.isArray((tr.data as any)?.results)) {
        for (const item of (tr.data as any).results) {
          results.push({
            title: item.title,
            url: item.url,
            description: item.content,
            score: item.score,
            publishedAt: item.published_date,
          });
        }
      }
    }

    // 2. Try Google
    if (googleKey && googleCx) {
      const gr = await googleSearch(q, googleKey, googleCx);
      if (gr.ok && Array.isArray((gr.data as any)?.items)) {
        for (const item of (gr.data as any).items) {
          results.push({
            title: item.title,
            url: item.link,
            description: item.snippet,
          });
        }
      }
    }

    let emitted = 0;
    for (const res of results) {
      const url = res.url.trim();
      if (!url || seen.has(url)) continue;
      seen.add(url);
      emitted++;
      write({
        type: "result",
        query: q,
        title: res.title,
        url,
        description: res.description,
        score: res.score,
        publishedAt: res.publishedAt,
      });
    }

    write({
      type: "query_done",
      query: q,
      returned: results.length,
      emitted,
    });
  });

  await Promise.allSettled(tasks);
  write({
    type: "done",
    count: seen.size,
  });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();

  if (!q || q.length > 400) {
    return Response.json({ error: "Search query must be 1-400 characters." }, { status: 400 });
  }

  return ndjsonStream((write) => runWebSearch(q, write));
}
