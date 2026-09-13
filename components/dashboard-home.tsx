"use client";

import { HeroConsole } from "./hero-console";
import { QuickAccess } from "./quick-access";
import type { SearchMode } from "@/lib/omen";

export function DashboardHome({
  query,
  onQueryChange,
  mode,
  onModeChange,
  onRun,
  onNavigate,
  calm,
}: {
  query: string;
  onQueryChange: (v: string) => void;
  mode: SearchMode;
  onModeChange: (m: SearchMode) => void;
  onRun: () => void;
  onNavigate: (id: string) => void;
  calm: boolean;
}) {
  return (
    <div className="space-y-6">
      <HeroConsole
        query={query}
        onQueryChange={onQueryChange}
        onRun={onRun}
        mode={mode}
        onModeChange={onModeChange}
        busy={false}
        calm={calm}
      />
      <QuickAccess onNavigate={onNavigate} />
    </div>
  );
}
