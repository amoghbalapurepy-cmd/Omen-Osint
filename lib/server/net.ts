// Server-only HTTP helpers ported from the original OMEN Node backend.
// These run exclusively in Next.js route handlers (nodejs runtime).
// Credentials such as TAVILY_API_KEY are read here, never sent to the client.

export const UA = "OMEN-OSINT/4.0 (public-profile-research; local-user-run)";

export type FetchResult = {
  ok?: boolean;
  status?: number;
  data?: unknown;
  finalUrl?: string;
  error?: string;
};

export async function getJson(
  url: string,
  timeout = 8000,
  extraHeaders: Record<string, string> = {},
): Promise<FetchResult> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeout);
  try {
    const r = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": UA, ...extraHeaders },
      signal: ac.signal,
      redirect: "follow",
    });
    let data: unknown = null;
    try {
      data = await r.json();
    } catch {
      /* ignore non-json bodies */
    }
    return { ok: r.ok, status: r.status, data, finalUrl: r.url };
  } catch (e) {
    const err = e as { name?: string; message?: string };
    return {
      error: err?.name === "AbortError" ? "timeout" : err?.message || "network error",
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function postJson(
  url: string,
  body: unknown,
  timeout = 15000,
  extraHeaders: Record<string, string> = {},
): Promise<FetchResult> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeout);
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": UA,
        ...extraHeaders,
      },
      body: JSON.stringify(body),
      signal: ac.signal,
      redirect: "follow",
    });
    let data: unknown = null;
    try {
      data = await r.json();
    } catch {
      /* ignore non-json bodies */
    }
    return { ok: r.ok, status: r.status, data, finalUrl: r.url };
  } catch (e) {
    const err = e as { name?: string; message?: string };
    return {
      error: err?.name === "AbortError" ? "timeout" : err?.message || "network error",
    };
  } finally {
    clearTimeout(timer);
  }
}

/** Build an NDJSON streaming Response from an async producer. */
export function ndjsonStream(
  producer: (write: (event: Record<string, unknown>) => void) => Promise<void>,
  extraInit: (write: (event: Record<string, unknown>) => void) => void = () => {},
): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const write = (event: Record<string, unknown>) =>
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
      try {
        extraInit(write);
        await producer(write);
      } catch (e) {
        const err = e as { message?: string };
        write({ type: "search_error", error: err?.message || "stream error" });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
