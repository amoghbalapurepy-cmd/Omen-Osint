"use client";

import { useState } from "react";
import {
  MODE_TO_MODULE,
  MODULE_MAP,
  type SearchMode,
} from "@/lib/omen";
import { OmenHeader } from "./omen-header";
import { OmenSidebar } from "./omen-sidebar";
import { DashboardHome } from "./dashboard-home";
import { SystemStatus } from "./system-status";
import { RecentActivity } from "./recent-activity";
import { SettingsPage } from "./settings-page";
import { LogsPage } from "./logs-page";
import { ToolPage } from "./tool-page";

export function AppShell() {
  const [active, setActive] = useState("dashboard");
  const [mode, setMode] = useState<SearchMode>("Web");
  const [query, setQuery] = useState("");
  const [calm, setCalm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auto-run coordination: bumping runToken remounts the target ToolPage.
  const [runToken, setRunToken] = useState(0);
  const [autoRun, setAutoRun] = useState<{ moduleId: string; query: string } | null>(null);

  function navigate(moduleId: string) {
    setActive(moduleId);
    setAutoRun(null);
  }

  function runFromHero() {
    const moduleId = MODE_TO_MODULE[mode];
    setActive(moduleId);
    setAutoRun({ moduleId, query });
    setRunToken((t) => t + 1);
  }

  const module = MODULE_MAP[active];
  const isDashboard = active === "dashboard";

  function renderMain() {
    if (isDashboard) {
      return (
        <DashboardHome
          query={query}
          onQueryChange={setQuery}
          mode={mode}
          onModeChange={setMode}
          onRun={runFromHero}
          onNavigate={navigate}
          calm={calm}
        />
      );
    }
    if (active === "settings") return <SettingsPage />;
    if (active === "logs") return <LogsPage />;
    if (module) {
      const shouldAuto = autoRun?.moduleId === active;
      return (
        <ToolPage
          key={`${active}-${runToken}`}
          module={module}
          initialQuery={shouldAuto ? autoRun!.query : ""}
          autoRun={shouldAuto}
        />
      );
    }
    return null;
  }

  return (
    <div className="flex h-dvh flex-col bg-background">
      <OmenHeader
        onNavigate={navigate}
        calm={calm}
        onToggleCalm={() => setCalm((c) => !c)}
        onToggleSidebar={() => setSidebarOpen((s) => !s)}
      />

      <div className="flex min-h-0 flex-1">
        <OmenSidebar
          active={active}
          onNavigate={navigate}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="flex min-w-0 flex-1">
          <main className="min-w-0 flex-1 overflow-y-auto px-4 py-5 lg:px-8 lg:py-7">
            <div className="fade-up mx-auto max-w-[1200px]">{renderMain()}</div>
          </main>

          {isDashboard && (
            <aside className="hidden w-[330px] shrink-0 space-y-4 overflow-y-auto border-l border-line px-4 py-7 2xl:block">
              <SystemStatus />
              <RecentActivity onViewAll={() => navigate("logs")} />
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
