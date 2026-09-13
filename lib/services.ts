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

// ---------- PLACEHOLDER services (clearly marked demo output) ----------
// These return realistic demo state so the modules are fully navigable.
// Wire them to the corresponding OMEN backend endpoints to run live checks.

function demo(
  rows: { label: string; value: string; tone?: "cyan" | "green" | "warning" | "error" }[],
): Runner {
  return async (input, { onEvent, signal }) => {
    onEvent({
      type: "notice",
      message:
        "Demo output — connect the OMEN backend endpoint for this module to run a live check.",
    });
    for (const row of rows) {
      if (signal?.aborted) break;
      await new Promise((r) => setTimeout(r, 120));
      onEvent({
        type: "result",
        kind: "generic",
        label: row.label,
        value: row.value.replace("{q}", input || "—"),
        tone: row.tone ?? "cyan",
      });
    }
    onEvent({ type: "done" });
  };
}

/** PLACEHOLDER: domain / email exposure lookup. */
export const runDomainLookup: Runner = demo([
  { label: "Target", value: "{q}" },
  { label: "DNS A record", value: "resolved (demo)", tone: "green" },
  { label: "MX / mail", value: "configured (demo)", tone: "green" },
  { label: "SPF", value: "present (demo)", tone: "green" },
  { label: "DMARC", value: "policy: quarantine (demo)", tone: "warning" },
  { label: "Breach exposure", value: "no public demo data", tone: "cyan" },
]);

/** PLACEHOLDER: URL safety analysis. */
export const runUrlAnalysis: Runner = demo([
  { label: "URL", value: "{q}" },
  { label: "Scheme", value: "https (demo)", tone: "green" },
  { label: "Redirect chain", value: "0 hops (demo)", tone: "green" },
  { label: "Reputation", value: "no signals (demo)", tone: "green" },
  { label: "Security headers", value: "partial (demo)", tone: "warning" },
]);

/** PLACEHOLDER: network diagnostics. */
export const runNetworkDiagnostics: Runner = demo([
  { label: "Endpoint", value: "{q}" },
  { label: "Reachability", value: "reachable (demo)", tone: "green" },
  { label: "Latency", value: "24 ms (demo)", tone: "cyan" },
  { label: "Geolocation", value: "public region (demo)", tone: "cyan" },
  { label: "Reverse DNS", value: "resolved (demo)", tone: "green" },
]);

/** PLACEHOLDER: authorized public port inspection. */
export const runPortScan: Runner = demo([
  { label: "Host", value: "{q}" },
  { label: "80 / http", value: "open (demo)", tone: "cyan" },
  { label: "443 / https", value: "open (demo)", tone: "green" },
  { label: "22 / ssh", value: "filtered (demo)", tone: "warning" },
  { label: "Scope", value: "authorized targets only", tone: "cyan" },
]);

/** PLACEHOLDER: whois / registration records. */
export const runWhois: Runner = demo([
  { label: "Domain", value: "{q}" },
  { label: "Registrar", value: "public registrar (demo)", tone: "cyan" },
  { label: "Created", value: "2014-01-01 (demo)", tone: "cyan" },
  { label: "Status", value: "clientTransferProhibited (demo)", tone: "green" },
]);

/** PLACEHOLDER: OSINT source directory filter. */
export const runOsintSources: Runner = demo([
  { label: "GitHub", value: "public code & repos", tone: "green" },
  { label: "Bluesky", value: "public social profiles", tone: "green" },
  { label: "Reddit", value: "public user activity", tone: "green" },
  { label: "npm", value: "public maintainer evidence", tone: "green" },
  { label: "Keybase", value: "public identity proofs", tone: "green" },
]);

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
