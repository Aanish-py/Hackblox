import { useId } from "react";
import clsx from "clsx";

export interface GigChainLogoProps {
  /**
   * "horizontal" = G-mark + "GigChain" wordmark
   * "symbol" = G/Shield mark only
   * "stacked" = G/Shield mark + "GigChain" + optional tagline
   */
  variant?: "horizontal" | "symbol" | "stacked";
  /** Predefined size or custom pixel height */
  size?: "xs" | "sm" | "md" | "lg" | "xl" | number;
  /**
   * "light" = Dark navy left shield, emerald right accents, dark navy text
   * "dark" = Slate/white accents for dark backgrounds
   * "mono" = currentColor for all vector paths and text
   */
  theme?: "light" | "dark" | "mono";
  /** Whether to render the official tagline: "TRUST BUILDS FREELANCE" */
  showTagline?: boolean;
  className?: string;
}

// ─── Precision Vector Geometry ──────────────────────────────────────────────
// Replicates the approved GigChain logo:
// - Geometric G + shield-style mark with top apex and lower shield point
// - Negative space forming the inner cavity and G-crossbar aperture
// - Dark navy/charcoal left structure
// - Emerald right-side accent and fold transition
// ─────────────────────────────────────────────────────────────────────────────

interface EmblemProps {
  width: number;
  height: number;
  theme: "light" | "dark" | "mono";
  className?: string;
}

export function GigChainEmblem({ width, height, theme, className }: EmblemProps) {
  const isMono = theme === "mono";
  const isDark = theme === "dark";

  // useId generates a unique per-instance prefix so gradient IDs never collide
  // when multiple GigChainEmblem instances render on the same page.
  const uid = useId().replace(/:/g, "");
  const gradId = (name: string) => `gc-${uid}-${name}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 100 115"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={clsx("shrink-0 block select-none", className)}
    >
      <defs>
        {!isMono && (
          <>
            <linearGradient
              id={gradId("navyLeft")}
              x1="50"
              y1="0"
              x2="10"
              y2="100"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor={isDark ? "#2A3D5E" : "#1B2F4C"} />
              <stop offset="45%" stopColor={isDark ? "#172740" : "#0F2038"} />
              <stop offset="100%" stopColor={isDark ? "#0D1829" : "#081426"} />
            </linearGradient>

            <linearGradient
              id={gradId("emeraldTop")}
              x1="50"
              y1="0"
              x2="100"
              y2="55"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor={isDark ? "#09BE97" : "#05A683"} />
              <stop offset="55%" stopColor={isDark ? "#13D1A8" : "#0BB892"} />
              <stop offset="100%" stopColor={isDark ? "#1DE2B6" : "#14C49E"} />
            </linearGradient>

            <linearGradient
              id={gradId("foldShadow")}
              x1="60"
              y1="45"
              x2="80"
              y2="65"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor={isDark ? "#0A332C" : "#063D34"} />
              <stop offset="100%" stopColor={isDark ? "#0E453C" : "#0A4D42"} />
            </linearGradient>

            <linearGradient
              id={gradId("emeraldBottom")}
              x1="50"
              y1="115"
              x2="100"
              y2="70"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor={isDark ? "#48DFCA" : "#55D1BA"} />
              <stop offset="40%" stopColor={isDark ? "#21C9AC" : "#24BEA2"} />
              <stop offset="100%" stopColor={isDark ? "#0BB89B" : "#0CAE90"} />
            </linearGradient>
          </>
        )}
      </defs>

      {/* 1. Left Shield / G-Outer Spine */}
      <path
        d="M 50 0 L 0 22 C -0.5 48 8 82 50 115 L 50 96 C 24 76 21 48 50 22 Z"
        fill={isMono ? "currentColor" : `url(#${gradId("navyLeft")})`}
      />

      {/* 2. Fold shadow under crossbar (provides depth for the G inner tuck) */}
      <path
        d="M 50 22 C 68 22 80 32 82 44 L 58 60 L 50 60 Z"
        fill={isMono ? "currentColor" : `url(#${gradId("foldShadow")})`}
        opacity={isMono ? 0.35 : 1}
      />

      {/* 3. Top-Right Emerald Arch + Folded G-Crossbar */}
      <path
        d="M 50 0 L 100 22 C 100.5 32 100 42 98.5 50 L 68 50 L 48 50 C 42 50 39 53 39 57.5 C 39 62 42 65 48 65 L 75 65 C 80 65 85 62 88 57 L 98.5 50 C 98.5 50 94 34 81 26 C 72 20 62 21 50 22 Z"
        fill={isMono ? "currentColor" : `url(#${gradId("emeraldTop")})`}
      />

      {/* 4. Lower-Right Emerald Upright Stem */}
      <path
        d="M 50 115 C 82 92 98 78 100 68 L 78 68 C 76 77 70 87 50 96 Z"
        fill={isMono ? "currentColor" : `url(#${gradId("emeraldBottom")})`}
        opacity={isMono ? 0.75 : 1}
      />
    </svg>
  );
}

// ─── Size mappings ───────────────────────────────────────────────────────────
const SIZE_MAP = {
  xs: { markH: 18, markW: 16, textPx: "14px", gap: "6px", taglinePx: "6px" },
  sm: { markH: 26, markW: 23, textPx: "18px", gap: "8px", taglinePx: "7px" },
  md: { markH: 34, markW: 30, textPx: "23px", gap: "10px", taglinePx: "8px" },
  lg: { markH: 48, markW: 42, textPx: "32px", gap: "12px", taglinePx: "10px" },
  xl: { markH: 68, markW: 60, textPx: "44px", gap: "16px", taglinePx: "12px" },
} as const;

export default function GigChainLogo({
  variant = "horizontal",
  size = "md",
  theme = "light",
  showTagline = false,
  className,
}: GigChainLogoProps) {
  let markH: number;
  let markW: number;
  let textPx: string;
  let gap: string;
  let taglinePx: string;

  if (typeof size === "number") {
    markH = size;
    markW = Math.round((size * 100) / 115);
    textPx = `${Math.round(size * 0.7)}px`;
    gap = `${Math.max(6, Math.round(size * 0.25))}px`;
    taglinePx = `${Math.max(7, Math.round(size * 0.22))}px`;
  } else {
    const s = SIZE_MAP[size] || SIZE_MAP.md;
    markH = s.markH;
    markW = s.markW;
    textPx = s.textPx;
    gap = s.gap;
    taglinePx = s.taglinePx;
  }

  const mark = (
    <GigChainEmblem
      width={markW}
      height={markH}
      theme={theme}
    />
  );

  if (variant === "symbol") {
    return (
      <span
        className={clsx("inline-flex items-center justify-center shrink-0", className)}
        aria-label="GigChain Logo"
      >
        {mark}
      </span>
    );
  }

  // Color mappings for typography
  const gigColor = theme === "mono" ? "currentColor" : theme === "dark" ? "#FFFFFF" : "#0F1D38";
  const chainColor = theme === "mono" ? "currentColor" : theme === "dark" ? "#1CE2A0" : "#05A683";
  const taglineColor = theme === "mono" ? "currentColor" : theme === "dark" ? "#8EA0BF" : "#152844";

  if (variant === "stacked") {
    return (
      <div
        className={clsx("inline-flex flex-col items-center text-center select-none", className)}
        aria-label="GigChain — TRUST BUILDS FREELANCE"
      >
        {mark}
        <div
          className="font-bold tracking-tight mt-2 leading-none"
          style={{
            fontFamily: "'Space Grotesk', system-ui, sans-serif",
            fontSize: textPx,
          }}
        >
          <span style={{ color: gigColor }}>Gig</span>
          <span style={{ color: chainColor }}>Chain</span>
        </div>
        {(showTagline || true) && (
          <div
            className="font-semibold tracking-[0.22em] mt-1.5 uppercase leading-none opacity-90"
            style={{
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
              fontSize: taglinePx,
              color: taglineColor,
            }}
          >
            TRUST BUILDS FREELANCE
          </div>
        )}
      </div>
    );
  }

  // Default "horizontal" layout: Emblem + "GigChain" wordmark
  return (
    <span
      className={clsx("inline-flex items-center select-none", className)}
      style={{ gap }}
      aria-label="GigChain"
    >
      {mark}
      <span className="flex flex-col justify-center">
        <span
          className="font-bold tracking-tight leading-none"
          style={{
            fontFamily: "'Space Grotesk', system-ui, sans-serif",
            fontSize: textPx,
            letterSpacing: "-0.025em",
          }}
        >
          <span style={{ color: gigColor }}>Gig</span>
          <span style={{ color: chainColor }}>Chain</span>
        </span>
        {showTagline && (
          <span
            className="font-semibold tracking-[0.2em] mt-1 uppercase leading-none opacity-80"
            style={{
              fontFamily: "'Space Grotesk', system-ui, sans-serif",
              fontSize: taglinePx,
              color: taglineColor,
            }}
          >
            TRUST BUILDS FREELANCE
          </span>
        )}
      </span>
    </span>
  );
}
