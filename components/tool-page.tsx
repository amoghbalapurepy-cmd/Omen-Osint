"use client";

import { useEffect, useRef, useState } from "react";
import { ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import type { OmenModule } from "@/lib/omen";
import { runnerFor, type OmenEvent } from "@/lib/services";
import { useOmenLog } from "@/lib/use-omen-log";
import { SearchBar } from "./search-bar";
import { Panel, PanelHeader, StatusDot } from "./omen-ui";
import { cn } from "@/lib/cn";

type WebResult = { title: string; url: string; description: string; score: number | null };
type ReconResult = {
  provider: string;
  status: string;
  detail?: string;
  extra?: string;
  profile?: string;
  reason?: string;
  packages?: string[];
  count?: number;
};
type GenericRow = { label: string; value: string; tone: string };

const RECON_TONE: Record<string, "green" | "cyan" | "warning" | "muted" | "error"> = {
  confirmed: "green",
  evidence: "cyan",
  unverified: "warning",
  miss: "muted",
  none: "muted",
  checking: "cyan",
};

export function ToolPage({
  module,
  initialQuery = "",
  autoRun = false,
}: {
  module: OmenModule;
  initialQuery?: string;
  autoRun?: boolean;
}) {
  const { log } = useOmenLog();
  const [input, setInput] = useState(initialQuery);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [metaNote, setMetaNote] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [web, setWeb] = useState<WebResult[]>([]);
  const [recon, setRecon] = useState<Record<string, ReconResult>>({});
  const [generic, setGeneric] = useState<GenericRow[]>([]);
  const [ran, setRan] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const Icon = module.icon;

  function reset() {
    setProgress(null);
    setNotice(null);
    setMetaNote(null);
    setErrors([]);
    setWeb([]);
    setRecon({});
    setGeneric([]);
  }

  function run(value?: string) {
    const q = (value ?? input).trim();
    if ((module.kind === "web" || module.kind === "recon") && !q) {
      setErrors(["Enter a value to run this check."]);
      return;
    }
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    reset();
    setBusy(true);
    setRan(true);

    let resultCount = 0;
    const localErrors: string[] = [];

    const onEvent = (e: OmenEvent) => {
      switch (e.type) {
        case "meta":
          setMetaNote(String(e.note ?? ""));
          break;
        case "search_start":
          setProgress(`Querying ${String(e.provider ?? "provider")}…`);
          break;
        case "query":
          setProgress(`Query ${e.index}/${e.total}: ${String(e.q ?? "")}`);
          break;
        case "checking":
          setRecon((prev) => ({
            ...prev,
            [String(e.provider)]: { provider: String(e.provider), status: "checking" },
          }));
          setProgress(`Checking ${String(e.provider)}…`);
          break;
        case "notice":
          setNotice(String(e.message ?? ""));
          break;
        case "result": {
          if (e.kind === "generic") {
            resultCount++;
            setGeneric((prev) => [
              ...prev,
              { label: String(e.label), value: String(e.value), tone: String(e.tone ?? "cyan") },
            ]);
          } else if (e.provider) {
            resultCount++;
            setRecon((prev) => ({
              ...prev,
              [String(e.provider)]: {
                provider: String(e.provider),
                status: String(e.status ?? "unverified"),
                detail: e.detail as string,
                extra: e.extra as string,
                profile: e.profile as string,
                reason: e.reason as string,
                packages: e.packages as string[],
                count: e.count as number,
              },
            }));
          } else if (e.url) {
            resultCount++;
            setWeb((prev) => [
              ...prev,
              {
                title: String(e.title ?? "Untitled result"),
                url: String(e.url),
                description: String(e.description ?? ""),
                score: (e.score as number) ?? null,
              },
            ]);
          }
          break;
        }
        case "search_error":
          localErrors.push(String(e.error ?? "Unknown error"));
          setErrors((prev) => [...prev, String(e.error ?? "Unknown error")]);
          break;
        case "done":
          setBusy(false);
          setProgress(null);
          log({
            action: module.kind === "web" ? "SEARCH" : "SCAN",
            module: module.label,
            query: q || "—",
            status: localErrors.length && resultCount === 0 ? "error" : resultCount === 0 ? "empty" : "completed",
          });
          break;
      }
    };

    runnerFor(module.id)(q, { onEvent, signal: controller.signal }).catch(() => {
      setBusy(false);
      setProgress(null);
    });
  }

  useEffect(() => {
    if (autoRun && initialQuery.trim()) run(initialQuery);
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reconList = Object.values(recon);
  const hasResults = web.length > 0 || reconList.length > 0 || generic.length > 0;

  return (
    <div className="space-y-5">
      {/* module header */}
      <div className="flex items-start gap-4">
        <span className="flex size-11 items-center justify-center rounded-md border border-cyan-border bg-cyan/[0.07] text-cyan">
          <Icon size={20} strokeWidth={1.6} />
        </span>
        <div>
          <p className="mono text-[10px] uppercase tracking-[0.24em] text-muted">
            OMEN <span className="text-cyan/70">//</span> {module.group}
          </p>
          <h1 className="text-xl tracking-tight text-foreground">{module.label}</h1>
          <p className="mt-0.5 text-[13px] text-muted">{module.short}</p>
        </div>
      </div>

      <SearchBar
        value={input}
        onChange={setInput}
        onRun={() => run()}
        placeholder={module.placeholder}
        busy={busy}
      />

      {/* evidence-first reminder for OSINT modules */}
      {(module.kind === "recon" || module.kind === "web") && (
        <p className="flex items-center gap-2 text-[12px] text-muted">
          <ShieldCheck size={13} className="text-green" />
          Evidence first. Public sources only. A result is evidence, not proof of identity.
        </p>
      )}

      {/* status line */}
      {(busy || progress) && (
        <div className="flex items-center gap-2 text-[13px] text-cyan">
          <Loader2 size={14} className="animate-spin" />
          <span className="mono text-[12px]">{progress ?? "Working…"}</span>
        </div>
      )}

      {notice && (
        <div className="rounded-md border border-warning/30 bg-warning/[0.06] px-4 py-3 text-[12px] text-warning">
          {notice}
        </div>
      )}
      {metaNote && !notice && (
        <p className="text-[12px] leading-relaxed text-muted">{metaNote}</p>
      )}
      {errors.map((err, i) => (
        <div
          key={i}
          className="rounded-md border border-error/30 bg-error/[0.06] px-4 py-3 text-[12px] text-error"
        >
          {err}
        </div>
      ))}

      {/* RESULTS */}
      {reconList.length > 0 && (
        <Panel>
          <PanelHeader
            title="Provider Verification"
            action={<span className="label !text-muted">{reconList.length} sources</span>}
          />
          <ul className="divide-y divide-line">
            {reconList.map((r) => (
              <li key={r.provider} className="flex items-center gap-3 px-4 py-3">
                <StatusDot
                  tone={RECON_TONE[r.status] ?? "muted"}
                  pulse={r.status === "checking"}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] text-foreground">{r.provider}</span>
                    <span
                      className="mono text-[10px] uppercase tracking-[0.12em]"
                      style={{ color: `var(--${RECON_TONE[r.status] ?? "muted"})` }}
                    >
                      {r.status}
                    </span>
                  </div>
                  <p className="truncate text-[12px] text-muted">
                    {r.detail || r.reason || r.extra || (r.packages?.length ? r.packages.join(", ") : "—")}
                  </p>
                </div>
                {r.profile && (r.status === "confirmed" || r.status === "evidence") && (
                  <a
                    href={r.profile}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-[12px] text-cyan hover:opacity-80"
                  >
                    View <ExternalLink size={12} />
                  </a>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {web.length > 0 && (
        <Panel>
          <PanelHeader
            title="Public Web Results"
            action={<span className="label !text-muted">{web.length} results</span>}
          />
          <ul className="divide-y divide-line">
            {web.map((r, i) => (
              <li key={r.url + i} className="px-4 py-3">
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-[14px] text-foreground group-hover:text-cyan">
                      {r.title}
                    </p>
                    <p className="mono truncate text-[11px] text-cyan/60">{r.url}</p>
                    {r.description && (
                      <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-muted">
                        {r.description}
                      </p>
                    )}
                  </div>
                  <ExternalLink
                    size={14}
                    className="mt-1 shrink-0 text-muted group-hover:text-cyan"
                  />
                </a>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {generic.length > 0 && (
        <Panel>
          <PanelHeader title="Evidence" />
          <ul className="divide-y divide-line">
            {generic.map((row, i) => (
              <li key={i} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex items-center gap-3">
                  <StatusDot tone={(row.tone as "cyan") ?? "cyan"} />
                  <span className="text-[13px] text-secondary">{row.label}</span>
                </div>
                <span className="mono text-[12px] text-foreground">{row.value}</span>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {/* empty state */}
      {ran && !busy && !hasResults && errors.length === 0 && (
        <div className="rounded-md border border-line bg-panel/40 px-4 py-10 text-center">
          <p className="text-[13px] text-muted">
            No public evidence returned for this query.
          </p>
        </div>
      )}
    </div>
  );
}
