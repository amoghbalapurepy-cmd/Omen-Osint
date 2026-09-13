"use client";

import { ArrowRight, Clock, Globe } from "lucide-react";
import { MODULES, formatClock } from "@/lib/omen";
import { useOmenLog } from "@/lib/use-omen-log";
import { Panel, PanelHeader } from "./omen-ui";

function iconForModule(label: string) {
  const m = MODULES.find((x) => x.label === label);
  return m?.icon ?? Globe;
}

export function RecentActivity({
  onViewAll,
}: {
  onViewAll: () => void;
}) {
  const { entries, ready } = useOmenLog();
  const recent = entries.slice(0, 6);

  return (
    <Panel>
      <PanelHeader
        icon={<Clock size={15} />}
        title="Recent Activity"
        action={
          <button
            type="button"
            onClick={onViewAll}
            className="flex items-center gap-1 text-[11px] uppercase tracking-[0.14em] text-cyan hover:opacity-80"
          >
            View All <ArrowRight size={12} />
          </button>
        }
      />
      <ul className="divide-y divide-line">
        {ready && recent.length === 0 && (
          <li className="px-4 py-6 text-center text-[12px] text-muted">
            No activity yet. Run a search to create local history.
          </li>
        )}
        {recent.map((e) => {
          const Icon = iconForModule(e.module);
          return (
            <li key={e.id} className="flex items-center gap-3 px-4 py-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded border border-line bg-deep/60 text-cyan/80">
                <Icon size={15} strokeWidth={1.6} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] text-foreground">{e.module}</p>
                <p className="truncate text-[12px] text-muted">{e.query}</p>
              </div>
              <span className="mono shrink-0 text-[10px] tracking-[0.12em] text-muted">
                {formatClock(e.time)}
              </span>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
