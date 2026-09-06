"use client";

import { useCallback, useEffect, useState } from "react";
import { SEED_LOG, type LogEntry } from "./omen";

const STORAGE_KEY = "omen.log.v1";
const EVENT = "omen:log-changed";

function read(): LogEntry[] {
  if (typeof window === "undefined") return SEED_LOG;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return SEED_LOG;
    const parsed = JSON.parse(raw) as LogEntry[];
    return Array.isArray(parsed) ? parsed : SEED_LOG;
  } catch {
    return SEED_LOG;
  }
}

function write(entries: LogEntry[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    /* storage unavailable — local history simply won't persist */
  }
}

/**
 * Local-first activity log. Records application actions only — never
 * credentials, API keys, or tokens. Persists to browser storage and syncs
 * across components/tabs.
 */
export function useOmenLog() {
  const [entries, setEntries] = useState<LogEntry[]>(SEED_LOG);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setEntries(read());
    setReady(true);
    const sync = () => setEntries(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const log = useCallback(
    (entry: Omit<LogEntry, "id" | "time"> & { time?: string }) => {
      const next: LogEntry = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        time: entry.time ?? new Date().toISOString(),
        action: entry.action,
        module: entry.module,
        query: entry.query,
        status: entry.status,
      };
      const current = read();
      write([next, ...current].slice(0, 200));
    },
    [],
  );

  const clear = useCallback(() => write([]), []);

  return { entries, ready, log, clear };
}
