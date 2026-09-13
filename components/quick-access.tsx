"use client";

import { ArrowRight, Zap } from "lucide-react";
import { MODULE_MAP, QUICK_ACCESS_IDS } from "@/lib/omen";
import { OmenLogo } from "./omen-logo";

export function QuickAccess({
  onNavigate,
}: {
  onNavigate: (id: string) => void;
}) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <Zap size={15} className="text-cyan" />
        <h2 className="label !text-secondary">Quick Access</h2>
        <span className="ml-2 h-px flex-1 bg-line" aria-hidden />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {QUICK_ACCESS_IDS.map((id) => {
          const m = MODULE_MAP[id];
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className="group relative flex flex-col rounded-md border border-line bg-panel/60 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-cyan-border hover:bg-panel focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan"
            >
              <div className="mb-4 flex items-center justify-between">
                <OmenLogo size={30} />
                <ArrowRight
                  size={15}
                  className="text-muted transition-colors group-hover:text-cyan"
                />
              </div>
              <h3 className="text-[14px] font-medium text-foreground">{m.label}</h3>
              <p className="mt-1 text-[12px] leading-relaxed text-muted">{m.short}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
