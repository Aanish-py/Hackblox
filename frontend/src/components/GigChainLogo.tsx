import clsx from "clsx";

export interface GigChainLogoProps {
  /** "horizontal" = G-mark + "GigChain" wordmark side by side. "symbol" = G-mark only. */
  variant?: "horizontal" | "symbol";
  /** Controls output pixel size of the G-mark and proportional wordmark size. */
  size?: "sm" | "md" | "lg";
  /** "dark" = emerald mark on dark bg. "light" = dark emerald on light bg. "mono" = currentColor. */
  theme?: "dark" | "light" | "mono";
  className?: string;
}

// ─── G-mark SVG path ─────────────────────────────────────────────────────────
// ViewBox: 0 0 64 64  |  Center: (32, 32)  |  Arc radius: 26
//
// Geometry:
//   1. Major arc — from (53.3, 17.1) counterclockwise (~310°) to (57.1, 38.7)
//      This traces the C-portion of the G: upper-right → top → left → bottom → right
//      The arc "opens" at the upper-right — conceptually the Client↔Freelancer aperture
//   2. Horizontal crossbar — from arc endpoint (57.1, 38.7) leftward to (36.5, 38.7)
//      Positioned ~25% below mid-height, matching standard G letterform proportions
//   3. Short perpendicular tick — from (36.5, 38.7) down to (36.5, 46)
//      Subtle architectural anchor; implies "link" without being a literal chain symbol
//
// SVG arc flags: large-arc=1, sweep=0 (counterclockwise on screen)
const G_PATH = "M 53.3,17.1 A 26,26 0 1 0 57.1,38.7 L 36.5,38.7 L 36.5,46";

// ─── Color palette ────────────────────────────────────────────────────────────
// Charcoal (#1C2730) + Matte Emerald (#2B7A52) / Light Emerald (#1A5C3D)
// Professional matte fintech palette.
const THEME = {
  dark:  { mark: "#2B7A52", text: "#FFFFFF" },   // Matte Emerald on dark bg
  light: { mark: "#1A5C3D", text: "#1C2730" },   // Light-background dark emerald + charcoal text
  mono:  { mark: "currentColor", text: "currentColor" },
} as const;

// ─── Size configuration ───────────────────────────────────────────────────────
// stroke is expressed in viewBox units (64px vb). At sm (28px output):
//   rendered stroke = 5.0 * (28/64) = 2.19px — clean and readable.
const SIZES = {
  sm: { px: 28, stroke: 5.0, textPx: "17px", gap: "7px"  },
  md: { px: 36, stroke: 5.0, textPx: "22px", gap: "9px"  },
  lg: { px: 48, stroke: 5.0, textPx: "29px", gap: "12px" },
} as const;

export default function GigChainLogo({
  variant = "horizontal",
  size = "md",
  theme = "dark",
  className,
}: GigChainLogoProps) {
  const { px, stroke, textPx, gap } = SIZES[size];
  const { mark, text } = THEME[theme];

  const gMark = (
    <svg
      width={px}
      height={px}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ flexShrink: 0, display: "block" }}
    >
      <path
        d={G_PATH}
        stroke={mark}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  if (variant === "symbol") {
    return (
      <span
        className={clsx("inline-flex items-center justify-center", className)}
        aria-label="GigChain"
      >
        {gMark}
      </span>
    );
  }

  return (
    <span
      className={clsx("inline-flex items-center", className)}
      style={{ gap }}
      aria-label="GigChain"
    >
      {gMark}
      <span
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 700,
          fontSize: textPx,
          letterSpacing: "-0.02em",
          color: text,
          lineHeight: 1,
          userSelect: "none",
        }}
      >
        GigChain
      </span>
    </span>
  );
}
