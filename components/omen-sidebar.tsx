"use client";

import { Diamond, X } from "lucide-react";
import { MODULES, NAV_GROUPS, type ModuleGroup } from "@/lib/omen";
import { OmenLogo } from "./omen-logo";
import { cn } from "@/lib/cn";

type SidebarProps = {
  active: string;
  onNavigate: (moduleId: string) => void;
  open: boolean;
  onClose: () => void;
};

function NavItem({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: (typeof MODULES)[number]["icon"];
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex w-full items-center gap-3 rounded-md py-2 pl-3 pr-2 text-left transition-colors",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan",
        active
          ? "border border-cyan-border bg-cyan/[0.07] text-foreground"
          : "border border-transparent text-secondary hover:bg-panel/60 hover:text-foreground",
      )}
    >
      {active && (
        <span
          aria-hidden
          className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-cyan shadow-[0_0_8px_var(--cyan)]"
        />
      )}
      <Icon
        size={16}
        strokeWidth={1.6}
        className={cn(active ? "text-cyan" : "text-muted group-hover:text-secondary")}
      />
      <span className="text-[13px] tracking-tight">{label}</span>
    </button>
  );
}

export function OmenSidebar({ active, onNavigate, open, onClose }: SidebarProps) {
  return (
    <>
      {/* mobile backdrop */}
      {open && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={cn(
          "z-50 flex w-[260px] shrink-0 flex-col border-r border-line bg-surface/60",
          "fixed inset-y-0 left-0 transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between px-4 py-3 lg:hidden">
          <span className="label">Navigation</span>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={onClose}
            className="text-secondary hover:text-foreground"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {NAV_GROUPS.map((group: ModuleGroup) => {
            const items = MODULES.filter((m) => m.group === group);
            if (!items.length) return null;
            return (
              <div key={group}>
                <p className="label px-3 pb-2">{group}</p>
                <div className="space-y-0.5">
                  {items.map((m) => (
                    <NavItem
                      key={m.id}
                      active={active === m.id}
                      onClick={() => {
                        onNavigate(m.id);
                        onClose();
                      }}
                      icon={m.icon}
                      label={m.label}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="space-y-3 border-t border-line p-3">
          <div className="rounded-md border border-line bg-panel/60 p-3">
            <div className="flex items-center gap-2">
              <Diamond size={12} className="text-cyan" fill="var(--cyan)" />
              <span className="mono text-[11px] uppercase tracking-[0.18em] text-foreground">
                Private • Local First
              </span>
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-muted">
              Queries stay on your device until a public-source check is started.
            </p>
          </div>
          <div className="flex items-center gap-2 px-1">
            <OmenLogo size={18} />
            <span className="mono text-[10px] uppercase tracking-[0.2em] text-muted">
              OMEN v1.0.0
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
