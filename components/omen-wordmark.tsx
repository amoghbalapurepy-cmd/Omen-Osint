import { cn } from "@/lib/cn";

/**
 * OMEN wordmark — thin, geometric, widely-spaced uppercase.
 * Handled as brand typography (mono, tracked) per the identity board.
 */
export function OmenWordmark({
  className,
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-2xl",
  };
  return (
    <span
      className={cn(
        "mono font-light uppercase leading-none text-foreground",
        "tracking-[0.42em]",
        sizes[size],
        className,
      )}
    >
      OMEN
    </span>
  );
}
