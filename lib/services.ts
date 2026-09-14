// ============================================================
// OMEN client service layer
// ------------------------------------------------------------
// Thin functions that map UI actions to backend endpoints. They are
// intentionally decoupled from presentation so the existing OMEN backend
// can be connected without touching component code.
//
// API credentials (e.g. TAVILY_API_KEY) live ONLY on the server. These
// client functions never see, store, or transmit secrets.
// ============================================================

export type OmenEvent = { type: string; [key: string]: unknown };

export type Runner = (
  input: string,
  opts: { onEvent: (e: OmenEvent) => void; signal?: AbortSignal },
) => Promise<void>;

/** Read a newline-delimited JSON (NDJSON) stream and dispatch each event. */
async function streamNdjson(
  url: string,
  onEvent: (e: OmenEvent) => void,
  signal?: AbortSignal,
) {
  const res = await fetch(url, { signal, cache: "no-store" });
  if (!res.ok) {
    let message = `Request failed (HTTP ${res.status}).`;
    try {
      const body = (await res.json()) as { error?: string };
      if (body?.error) message = body.error;
    } catch {
      /* ignore */
    }
    onEvent({ type: "search_error", error: message });
    onEvent({ type: "done" });
    return;
  }
  const reader = res.body?.getReader();
  if (!reader) {
    onEvent({ type: "search_error", error: "No response stream available." });
    onEvent({ type: "done" });
    return;
  }
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx: number;
    while ((idx = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, idx).trim();
      buffer = buffer.slice(idx + 1);
      if (!line) continue;
      try {
        onEvent(JSON.parse(line) as OmenEvent);
      } catch {
        /* skip malformed line */
      }
    }
  }
  const tail = buffer.trim();
  if (tail) {
    try {
      onEvent(JSON.parse(tail) as OmenEvent);
    } catch {
      /* ignore */
    }
  }
}

// ---------- REAL endpoints (backed by the OMEN Node backend) ----------

/** Public web search via Tavily. Streams result/query/done events. */
export const runWebSearch: Runner = (input, { onEvent, signal }) =>
  streamNdjson(`/api/websearch?q=${encodeURIComponent(input)}`, onEvent, signal);

/** Public username / profile verification across public providers. */
export const runRecon: Runner = (input, { onEvent, signal }) =>
  streamNdjson(
    `/api/recon?username=${encodeURIComponent(input.replace(/^@+/, ""))}`,
    onEvent,
    signal,
  );

/** Domain / email exposure lookup. */
export const runDomainLookup: Runner = (input, { onEvent, signal }) =>
  streamNdjson(`/api/domain?q=${encodeURIComponent(input)}`, onEvent, signal);

/** URL safety analysis. */
export const runUrlAnalysis: Runner = (input, { onEvent, signal }) =>
  streamNdjson(`/api/urlanalysis?q=${encodeURIComponent(input)}`, onEvent, signal);

/** Network diagnostics. */
export const runNetworkDiagnostics: Runner = (input, { onEvent, signal }) =>
  streamNdjson(`/api/network?q=${encodeURIComponent(input)}`, onEvent, signal);

/** Authorized public port inspection. */
export const runPortScan: Runner = (input, { onEvent, signal }) =>
  streamNdjson(`/api/portscan?q=${encodeURIComponent(input)}`, onEvent, signal);

/** WHOIS / registration records. */
export const runWhois: Runner = (input, { onEvent, signal }) =>
  streamNdjson(`/api/whois?q=${encodeURIComponent(input)}`, onEvent, signal);

/** OSINT source directory filter. */
export const runOsintSources: Runner = (input, { onEvent, signal }) =>
  streamNdjson(`/api/recon?username=${encodeURIComponent(input)}`, onEvent, signal);

/** Route a module id to its runner. */
export function runnerFor(moduleId: string): Runner {
  switch (moduleId) {
    case "web":
      return runWebSearch;
    case "social":
    case "username":
      return runRecon;
    case "domain":
      return runDomainLookup;
    case "url":
      return runUrlAnalysis;
    case "network":
      return runNetworkDiagnostics;
    case "port":
      return runPortScan;
    case "whois":
      return runWhois;
    case "sources":
      return runOsintSources;
    default:
      return runWebSearch;
  }
}
