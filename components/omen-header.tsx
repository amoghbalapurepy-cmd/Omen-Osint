"use client";

import { useEffect, useState } from "react";
import { Contrast, Menu, ScrollText, Settings } from "lucide-react";
import { OmenLogo } from "./omen-logo";
import { OmenWordmark } from "./omen-wordmark";
import { StatusDot } from "./omen-ui";
import { cn } from "@/lib/cn";

type HeaderProps = {
  onNavigate: (moduleId: string) => void;
  calm: boolean;
  onToggleCalm: () => void;
  onToggleSidebar: () => void;
};

function IconButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex size-9 items-center justify-center rounded-md border transition-colors",
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan",
        active
          ? "border-cyan-border bg-cyan/10 text-cyan"
          : "border-line text-secondary hover:border-cyan-border hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

export function OmenHeader({
  onNavigate,
  calm,
  onToggleCalm,
  onToggleSidebar,
}: HeaderProps) {
  const [online, setOnline] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/health", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (alive) setOnline(Boolean(d?.ok));
      })
      .catch(() => {
        if (alive) setOnline(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <header className="relative z-30 flex h-16 shrink-0 items-center justify-between border-b border-line bg-background/85 px-4 backdrop-blur-sm lg:px-6">
      {/* subtle cyan geometric accent on the right edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute right-[260px] top-0 hidden h-full w-24 lg:block"
        style={{
          background:
            "linear-gradient(115deg, transparent 0%, transparent 48%, var(--cyan-border) 49%, transparent 50%)",
          opacity: 0.5,
        }}
      />

      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Toggle navigation"
          onClick={onToggleSidebar}
          className="flex size-9 items-center justify-center rounded-md border border-line text-secondary hover:text-foreground lg:hidden"
        >
          <Menu size={18} />
        </button>

        <button
          type="button"
          onClick={() => onNavigate("dashboard")}
          className="flex items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan"
          aria-label="OMEN home"
        >
          <OmenLogo size={34} glow />
          <span aria-hidden className="hidden h-7 w-px bg-cyan-border sm:block" />
          <OmenWordmark size="md" className="hidden sm:inline" />
        </button>

        <div className="ml-2 hidden border-l border-line pl-4 md:block">
          <p className="label leading-[1.35]">SEE WHAT&apos;S PUBLIC.</p>
          <p className="label leading-[1.35]">UNDERSTAND THE EVIDENCE.</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <IconButton
          label="Toggle ambient motion"
          active={calm}
          onClick={onToggleCalm}
        >
          <Contrast size={17} />
        </IconButton>
        <IconButton label="Open activity logs" onClick={() => onNavigate("logs")}>
          <ScrollText size={17} />
        </IconButton>
        <IconButton label="Open settings" onClick={() => onNavigate("settings")}>
          <Settings size={17} />
        </IconButton>

        <div className="ml-1 flex items-center gap-2 rounded-md border border-line bg-panel/70 px-3 py-2">
          <StatusDot tone="green" pulse />
          <span className="mono text-[11px] uppercase tracking-[0.2em] text-foreground">
            {online ? "Online" : "Local Mode"}
          </span>
        </div>
      </div>
    </header>
  );
}
