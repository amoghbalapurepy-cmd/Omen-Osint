"use client";

import { Download, Trash2 } from "lucide-react";
import { formatStamp } from "@/lib/omen";
import { useOmenLog } from "@/lib/use-omen-log";
import { cn } from "@/lib/cn";

const STATUS_COLOR: Record<string, string> = {
  completed: "var(--green)",
  running: "var(--cyan)",
  empty: "var(--muted)",
  error: "var(--error)",
};

export function LogsPage() {
  const { entries, clear } = useOmenLog();

  function exportJson() {
    const blob = new Blob([JSON.stringify(entries, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `omen-logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl tracking-tight text-foreground">Logs</h1>
          <p className="mt-1 text-[13px] text-muted">
            Local application activity only. Credentials and tokens are never logged.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={exportJson}
            className="flex items-center gap-2 rounded-md border border-cyan-border bg-cyan/10 px-3 py-2 text-[12px] text-cyan transition-colors hover:bg-cyan hover:text-background"
          >
            <Download size={14} /> Export JSON
          </button>
          <button
            type="button"
            onClick={clear}
            className="flex items-center gap-2 rounded-md border border-line px-3 py-2 text-[12px] text-secondary transition-colors hover:border-error/50 hover:text-error"
          >
            <Trash2 size={14} /> Clear Logs
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-line">
        <div className="grid grid-cols-[110px_100px_1fr_1fr_110px] gap-2 border-b border-line bg-panel/60 px-4 py-3">
          {["Time", "Action", "Module", "Query", "Status"].map((h) => (
            <span key={h} className="label !text-muted">
              {h}
            </span>
          ))}
        </div>
        <div className="divide-y divide-line">
          {entries.length === 0 && (
            <p className="px-4 py-8 text-center text-[13px] text-muted">
              No log entries. Run a scan to create local activity.
            </p>
          )}
          {entries.map((e) => (
            <div
              key={e.id}
              className="grid grid-cols-[110px_100px_1fr_1fr_110px] items-center gap-2 px-4 py-3 text-[13px] hover:bg-panel/40"
            >
              <span className="mono text-[12px] text-muted">{formatStamp(e.time)}</span>
              <span className="mono text-[11px] uppercase tracking-[0.12em] text-cyan/80">
                {e.action}
              </span>
              <span className="truncate text-secondary">{e.module}</span>
              <span className="truncate text-foreground">{e.query}</span>
              <span
                className={cn("mono text-[11px] uppercase tracking-[0.1em]")}
                style={{ color: STATUS_COLOR[e.status] ?? "var(--secondary)" }}
              >
                {e.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
