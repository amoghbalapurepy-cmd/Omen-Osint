"use client";

import { useCallback, useEffect, useRef, useState, type MouseEvent } from "react";
import { OmenLogo } from "./omen-logo";
import { SearchBar } from "./search-bar";
import { QuickSearch } from "./quick-search";
import type { SearchMode } from "@/lib/omen";

type HeroConsoleProps = {
  query: string;
  onQueryChange: (v: string) => void;
  onRun: () => void;
  mode: SearchMode;
  onModeChange: (m: SearchMode) => void;
  busy: boolean;
  calm: boolean;
};

/** Faint radar / construction geometry behind the mark. */
function RadarField({ calm }: { calm: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <svg
        viewBox="0 0 400 400"
        className="h-[min(78vw,440px)] w-[min(78vw,440px)]"
        aria-hidden
      >
        <g fill="none" stroke="var(--line-strong)" strokeWidth="1">
          <circle cx="200" cy="200" r="70" />
          <circle cx="200" cy="200" r="120" />
          <circle cx="200" cy="200" r="170" stroke="var(--line)" />
          <circle
            cx="200"
            cy="200"
            r="196"
            stroke="var(--cyan-border)"
            strokeDasharray="2 6"
          />
        </g>
        {/* large diamond / construction square */}
        <rect
          x="70"
          y="70"
          width="260"
          height="260"
          fill="none"
          stroke="var(--line)"
          transform="rotate(45 200 200)"
        />
        {/* crosshair */}
        <g stroke="var(--line)" strokeWidth="1">
          <line x1="0" y1="200" x2="400" y2="200" />
          <line x1="200" y1="0" x2="200" y2="400" />
        </g>
        {/* tick markers */}
        <g fill="var(--cyan)">
          <circle cx="200" cy="30" r="2.2" />
          <circle cx="370" cy="200" r="2.2" opacity="0.6" />
          <circle cx="200" cy="370" r="1.8" opacity="0.4" />
        </g>
        {/* rotating sweep */}
        {!calm && (
          <g className="animate-sweep" style={{ transformOrigin: "200px 200px" }}>
            <defs>
              <linearGradient id="omen-sweep-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--cyan)" stopOpacity="0.18" />
                <stop offset="100%" stopColor="var(--cyan)" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d="M200 200 L200 4 A196 196 0 0 1 396 200 Z" fill="url(#omen-sweep-grad)" />
          </g>
        )}
      </svg>
    </div>
  );
}

export function HeroConsole({
  query,
  onQueryChange,
  onRun,
  mode,
  onModeChange,
  busy,
  calm,
}: HeroConsoleProps) {
  const markRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const reduced = useRef(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduced.current = mq.matches;
    const on = () => (reduced.current = mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  const handleMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (reduced.current || !markRef.current) return;
    const rect = markRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const max = 8;
    const dx = Math.max(-max, Math.min(max, (e.clientX - cx) * 0.06));
    const dy = Math.max(-max, Math.min(max, (e.clientY - cy) * 0.06));
    setOffset({ x: dx, y: dy });
  }, []);

  return (
    <section
      onMouseMove={handleMove}
      onMouseLeave={() => setOffset({ x: 0, y: 0 })}
      className="clip-notch relative overflow-hidden border border-line bg-deep/60 omen-grid"
    >
      <div className={calm ? "" : "omen-radial absolute inset-0"} aria-hidden />

      {/* corner microcopy */}
      <div className="pointer-events-none absolute inset-0 p-4 lg:p-6">
        <span className="mono text-[10px] uppercase tracking-[0.24em] text-muted">
          OMEN <span className="text-cyan/70">//</span> OSINT &amp; Security Console
        </span>
        <span className="mono absolute right-4 top-4 text-[10px] tracking-[0.18em] text-muted lg:right-6 lg:top-6">
          45.4642° N&nbsp;&nbsp;9.1900° E
        </span>
      </div>

      {/* visualization */}
      <div className="relative flex min-h-[360px] items-center justify-center px-6 pt-10 lg:min-h-[420px]">
        <RadarField calm={calm} />
        <div ref={markRef} className="relative z-10">
          <OmenLogo
            size={148}
            glow
            diamondOffset={offset}
            className="drop-shadow-[0_10px_40px_rgba(0,0,0,0.6)]"
          />
        </div>

        {/* OBSERVE / ANALYZE / DISCOVER */}
        <div className="absolute right-6 top-1/2 hidden -translate-y-1/2 flex-col gap-2 xl:flex">
          {["OBSERVE", "ANALYZE", "DISCOVER"].map((w) => (
            <div key={w} className="flex items-center gap-2">
              <span className="h-px w-4 bg-cyan-border" aria-hidden />
              <span className="mono text-[10px] uppercase tracking-[0.28em] text-secondary">
                {w}
              </span>
            </div>
          ))}
          <span className="mt-1 pl-6 text-muted" aria-hidden>
            —
          </span>
        </div>
      </div>

      {/* search controls */}
      <div className="relative z-10 space-y-4 px-4 pb-8 pt-2 lg:px-10">
        <div className="mx-auto max-w-3xl">
          <SearchBar
            value={query}
            onChange={onQueryChange}
            onRun={onRun}
            busy={busy}
            placeholder="Search anything... (username, domain, URL, keyword, etc.)"
          />
          <div className="mt-4 flex justify-center">
            <QuickSearch mode={mode} onSelect={onModeChange} />
          </div>
        </div>
      </div>
    </section>
  );
}
