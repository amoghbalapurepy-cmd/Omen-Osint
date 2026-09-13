import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function Panel({
  children,
  className,
  clip = false,
}: {
  children: ReactNode;
  className?: string;
  clip?: boolean;
}) {
  return (
    <section
      className={cn(
        "border border-line bg-panel/70",
        clip ? "clip-notch-sm" : "rounded-md",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function PanelHeader({
  icon,
  title,
  action,
}: {
  icon?: ReactNode;
  title: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex items-center justify-between border-b border-line px-4 py-3">
      <div className="flex items-center gap-2">
        {icon ? <span className="text-cyan/80">{icon}</span> : null}
        <h2 className="label !text-secondary">{title}</h2>
      </div>
      {action}
    </header>
  );
}

const TONE: Record<string, string> = {
  green: "bg-green shadow-[0_0_8px_var(--green)]",
  cyan: "bg-cyan shadow-[0_0_8px_var(--cyan)]",
  warning: "bg-warning shadow-[0_0_8px_var(--warning)]",
  error: "bg-error shadow-[0_0_8px_var(--error)]",
  muted: "bg-muted",
};

export function StatusDot({
  tone = "cyan",
  pulse = false,
  className,
}: {
  tone?: "green" | "cyan" | "warning" | "error" | "muted";
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block size-1.5 rounded-full",
        TONE[tone],
        pulse && "animate-status",
        className,
      )}
    />
  );
}
