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
      "bg-white border border-[#E2E4EE] rounded-xl shadow-xs transition-all duration-200 hover:border-[#D1D5E2] hover:shadow-sm",
      sizeClasses[size],
      "flex flex-col items-center text-center gap-3 group"
    )}>
      {/* Badge emoji in badge ring */}
      <div className={clsx(
        "w-14 h-14 rounded-full flex items-center justify-center bg-[#F1F2FA] border-2 group-hover:scale-105 transition-transform duration-200",
        level >= 4 ? "border-amber-400 bg-amber-50" : level >= 2 ? "border-[#23895A] bg-[#E8F5EE]" : "border-[#CBD2DE]"
      )}>
        <span className={emojiSizes[size]} role="img" aria-label={BadgeNames[badgeType]}>
          {BadgeEmoji[badgeType]}
        </span>
      </div>

      {/* Name + Level */}
      <div>
        <p className={clsx("font-display font-semibold text-[#172033]", size === "sm" ? "text-sm" : "text-base")}>
          {BadgeNames[badgeType]}
        </p>
        <p className="font-semibold text-xs mt-0.5 text-[#176B4A]">
          Level {level} · {BadgeLevelNames[level]}
        </p>
      </div>

      {/* Progress to next level */}
      {size !== "sm" && level < 5 && (
        <div className="w-full">
          <div className="flex justify-between text-xs text-[#5F6878] mb-1.5 font-medium">
            <span>{value.toLocaleString()}</span>
            <span>{nextThreshold.toLocaleString()} for L{level + 1}</span>
          </div>
          <div className="w-full h-1.5 bg-[#E2E4EE] rounded-full overflow-hidden">
            <div className="h-full bg-[#176B4A] rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      )}

      {level === 5 && size !== "sm" && (
        <div className="text-xs text-amber-700 font-semibold px-2 py-0.5 bg-amber-50 border border-amber-200 rounded-full">
          ✦ Max Level Achieved
        </div>
      )}

      {mintedAt && size !== "sm" && (
        <p className="text-[11px] text-[#8A93A3]">
          Earned {new Date(mintedAt * 1000).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
