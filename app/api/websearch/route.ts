import { ndjsonStream, postJson } from "@/lib/server/net";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getTavilyApiKey(): string {
  return process.env.TAVILY_API_KEY?.trim() || "";
}

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

async function tavilySearch(
  q: string,
  apiKey: string,
  maxResults = 10,
) {
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

function providerErrorCode(status?: number): string {
  if (status === 429) {
    return "PROVIDER_RATE_LIMITED";
  }

  if (status !== undefined && status >= 500) {
    return "UPSTREAM_ERROR";
  }

  if (status === 401 || status === 403) {
    return "INVALID_PROVIDER_CREDENTIAL";
  }

  return "PROVIDER_ERROR";
}

async function runWebSearch(input: string, write: WriteFn) {
  const apiKey = getTavilyApiKey();

  if (!apiKey) {
    write({
      type: "search_error",
      error:
        "TAVILY_API_KEY is not set. Add it in Settings or the project environment before running a public web search.",
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
    provider: "Tavily",
    query_count: queries.length,
  });

  const tasks = queries.map(async (q, index) => {
    write({
      type: "query",
      index: index + 1,
      total: queries.length,
      q,
    });

    try {
      const r = await tavilySearch(q, apiKey, 10);

      if (r.error) {
        write({
          type: "search_error",
          query: q,
          error: r.error,
          code: "PROVIDER_ERROR",
        });
        return;
      }

      if (!r.ok) {
        const d =
          r.data && typeof r.data === "object"
            ? (r.data as Record<string, unknown>)
            : null;

        const status = r.status;

        const detail =
          (typeof d?.detail === "string" && d.detail) ||
          (typeof d?.error === "string" && d.error) ||
          (typeof d?.message === "string" && d.message) ||
          `Tavily returned HTTP ${status ?? "unknown"}`;

        write({
          type: "search_error",
          query: q,
          http: status,
          error: detail,
          code: providerErrorCode(status),
        });

        return;
      }

      const payload =
        r.data && typeof r.data === "object"
          ? (r.data as { results?: unknown[] })
          : null;

      const results = Array.isArray(payload?.results)
        ? payload.results
        : [];

      let emitted = 0;

      for (const raw of results) {
        if (!raw || typeof raw !== "object") continue;

        const item = raw as Record<string, unknown>;
        const url = String(item.url || "").trim();

        if (!url || seen.has(url)) continue;

        seen.add(url);
        emitted++;

        write({
          type: "result",
          query: q,
          title: String(item.title || "Untitled result"),
          url,
          description: String(item.content || ""),
          score:
            typeof item.score === "number"
              ? item.score
              : null,
          publishedAt:
            typeof item.published_date === "string"
              ? item.published_date
              : null,
        });
      }

      write({
        type: "query_done",
        query: q,
        returned: results.length,
        emitted,
      });
    } catch (error) {
      write({
        type: "search_error",
        query: q,
        error:
          error instanceof Error
            ? error.message
            : "Unexpected provider error.",
        code: "PROVIDER_ERROR",
      });
    }
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
    return Response.json(
      {
        error: "Search query must be 1-400 characters.",
      },
      {
        status: 400,
      },
    );
  }

  return ndjsonStream((write) => runWebSearch(q, write));
}