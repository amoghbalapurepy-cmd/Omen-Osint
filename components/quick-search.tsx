"use client";

import { QUICK_SEARCH_MODES, type SearchMode } from "@/lib/omen";
import { cn } from "@/lib/cn";

export function QuickSearch({
  mode,
  onSelect,
}: {
  mode: SearchMode;
  onSelect: (m: SearchMode) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="label pr-1">Quick Search</span>
      {QUICK_SEARCH_MODES.map((m) => {
        const active = m === mode;
        return (
          <button
            key={m}
            type="button"
            onClick={() => onSelect(m)}
            aria-pressed={active}
            className={cn(
              "rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.16em] transition-colors",
              "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan",
              active
                ? "border-cyan-border bg-cyan/10 text-cyan"
                : "border-line text-muted hover:border-cyan-border hover:text-secondary",
            )}
          >
            {m}
          </button>
        );
      })}
    </div>
  );
}
