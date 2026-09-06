"use client";

import { useState, type KeyboardEvent } from "react";
import { ArrowRight, Search } from "lucide-react";
import { cn } from "@/lib/cn";

type SearchBarProps = {
  value: string;
  onChange: (v: string) => void;
  onRun: () => void;
  onEscape?: () => void;
  placeholder?: string;
  busy?: boolean;
  autoFocus?: boolean;
};

export function SearchBar({
  value,
  onChange,
  onRun,
  onEscape,
  placeholder = "Search anything... (username, domain, URL, keyword, etc.)",
  busy = false,
  autoFocus = false,
}: SearchBarProps) {
  const [focused, setFocused] = useState(false);

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    // Guard against CJK IME composition confirming with Enter.
    if (e.nativeEvent.isComposing || e.keyCode === 229) return;
    if (e.key === "Enter") {
      e.preventDefault();
      onRun();
    } else if (e.key === "Escape") {
      onChange("");
      onEscape?.();
    }
  }

  return (
    <div
      className={cn(
        "clip-notch flex items-center gap-3 border bg-deep/80 pl-4 pr-2 py-2 transition-colors",
        focused
          ? "border-cyan shadow-[0_0_0_1px_var(--cyan-border),0_0_24px_var(--cyan-glow)]"
          : "border-cyan-border/60 hover:border-cyan-border",
      )}
    >
      <Search size={18} className={focused ? "text-cyan" : "text-muted"} />
      <input
        // eslint-disable-next-line jsx-a11y/no-autofocus
        autoFocus={autoFocus}
        type="text"
        inputMode="search"
        aria-label="Search input"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="min-w-0 flex-1 bg-transparent py-2 text-[15px] text-foreground outline-none placeholder:text-muted"
      />
      <button
        type="button"
        onClick={onRun}
        disabled={busy}
        aria-label="Run search"
        className={cn(
          "flex size-10 items-center justify-center rounded transition-all",
          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan",
          busy
            ? "cursor-wait bg-cyan/20 text-cyan"
            : "bg-cyan/15 text-cyan hover:bg-cyan hover:text-background",
        )}
      >
        <ArrowRight size={18} className={busy ? "animate-pulse" : ""} />
      </button>
    </div>
  );
}
