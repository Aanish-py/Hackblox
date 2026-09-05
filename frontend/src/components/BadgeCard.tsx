import clsx from "clsx";
import { BadgeType, BadgeNames, BadgeEmoji, BadgeLevelColors, BadgeLevelNames } from "../lib/types";

interface BadgeCardProps {
  badgeType: BadgeType;
  level: number; // 1-5
  value: number;
  mintedAt?: number;
  size?: "sm" | "md" | "lg";
}

const badgeGlowClass: Record<number, string> = {
  1: "badge-glow-1",
  2: "badge-glow-2",
  3: "badge-glow-3",
  4: "badge-glow-4",
  5: "badge-glow-5",
};

const levelMaxValues: Record<BadgeType, number[]> = {
  [BadgeType.COMPLETED_GIGS]:     [5, 15, 30, 50, 100],
  [BadgeType.EARNINGS_MILESTONE]: [1, 5, 10, 25, 50],
  [BadgeType.STREAK]:             [3, 5, 10, 15, 20],
  [BadgeType.DISPUTE_FREE]:       [5, 15, 25, 40, 60],
  [BadgeType.INITIATIVE]:         [1, 1, 1, 1, 1],
  [BadgeType.SPECIAL]:            [1, 1, 1, 1, 1],
};

export default function BadgeCard({ badgeType, level, value, mintedAt, size = "md" }: BadgeCardProps) {
  const thresholds = levelMaxValues[badgeType];
  const currentThreshold = thresholds[level - 1] || 1;
  const nextThreshold = thresholds[level] || thresholds[level - 1];
  const progressPct = level >= 5 ? 100 : Math.min(100, (value / nextThreshold) * 100);

  const sizeClasses = {
    sm: "p-3",
    md: "p-5",
    lg: "p-6",
  };
  const emojiSizes = { sm: "text-2xl", md: "text-4xl", lg: "text-5xl" };

  return (
    <div className={clsx(
      "glass-card",
      sizeClasses[size],
      badgeGlowClass[level],
      "flex flex-col items-center text-center gap-3 group"
    )}>
      {/* Badge emoji in gradient ring */}
      <div className={clsx(
        "rounded-full p-3 bg-gradient-to-br",
        BadgeLevelColors[level],
        "shadow-lg group-hover:scale-110 transition-transform duration-300"
      )}>
        <span className={emojiSizes[size]} role="img" aria-label={BadgeNames[badgeType]}>
          {BadgeEmoji[badgeType]}
        </span>
      </div>

      {/* Name + Level */}
      <div>
        <p className={clsx("font-display font-semibold text-white", size === "sm" ? "text-sm" : "text-base")}>
          {BadgeNames[badgeType]}
        </p>
        <p className={clsx(
          "font-semibold text-xs mt-0.5 bg-gradient-to-r",
          BadgeLevelColors[level],
          "bg-clip-text text-transparent"
        )}>
          Level {level} · {BadgeLevelNames[level]}
        </p>
      </div>

      {/* Progress to next level */}
      {size !== "sm" && level < 5 && (
        <div className="w-full">
          <div className="flex justify-between text-xs text-slate-500 mb-1">
            <span>{value.toLocaleString()}</span>
            <span>{nextThreshold.toLocaleString()} for L{level + 1}</span>
          </div>
          <div className="milestone-progress">
            <div className="milestone-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      )}

      {level === 5 && size !== "sm" && (
        <div className="text-xs text-yellow-400 font-semibold animate-pulse-slow">✦ Max Level Achieved</div>
      )}

      {mintedAt && size !== "sm" && (
        <p className="text-xs text-slate-600">
          Earned {new Date(mintedAt * 1000).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
