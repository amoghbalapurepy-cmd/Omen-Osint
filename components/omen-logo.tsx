"use client";

import { useId } from "react";

type OmenLogoProps = {
  size?: number;
  className?: string;
  showDiamond?: boolean;
  glow?: boolean;
  /** Small px offset applied to the revealed diamond (interactive hero use). */
  diamondOffset?: { x: number; y: number };
  title?: string;
};

/**
 * OMEN primary symbol, built deliberately from the brand geometry:
 * a bold off-white segmented ring with an opening cut on the lower-right,
 * and a central cyan "revealed" diamond. The outer mark never rotates;
 * only the diamond may shift slightly toward the cursor.
 *
 * Geometry (viewBox 0 0 100 100), center (50,50):
 *  - outer radius 44, inner radius 25
 *  - ring spans ~310deg, gap (mouth) faces lower-right
 */
export function OmenLogo({
  size = 48,
  className,
  showDiamond = true,
  glow = false,
  diamondOffset = { x: 0, y: 0 },
  title = "OMEN",
}: OmenLogoProps) {
  const gid = useId().replace(/[:]/g, "");
  const glowId = `omen-glow-${gid}`;

  // Diamond offset expressed in viewBox units (svg is scaled from 100 units).
  const ox = (diamondOffset.x / size) * 100;
  const oy = (diamondOffset.y / size) * 100;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={title}
      className={className}
    >
      <defs>
        <filter id={glowId} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Segmented ring with lower-right opening */}
      <path
        d="M 65.05 91.34 A 44 44 0 1 1 91.34 65.05 L 73.5 58.55 A 25 25 0 1 0 58.55 73.5 Z"
        fill="var(--foreground)"
      />

      {/* Revealed element: cyan diamond */}
      {showDiamond && (
        <g
          transform={`translate(${ox} ${oy})`}
          filter={glow ? `url(#${glowId})` : undefined}
          style={{ transition: "transform 0.35s cubic-bezier(0.16,1,0.3,1)" }}
        >
          <path d="M 49 38 L 61 50 L 49 62 L 37 50 Z" fill="var(--cyan)" />
        </g>
      )}
    </svg>
  );
}
