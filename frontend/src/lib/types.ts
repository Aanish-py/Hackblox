import { ethers } from "ethers";

// ─── GIG STATE ENUM ────────────────────────────────────────────────────────
export enum GigState {
  Open = 0,
  InProgress = 1,
  Completed = 2,
  Disputed = 3,
  CancelledByClient = 4,
  CancelledByFreelancer = 5,
}

export const GigStateLabel: Record<GigState, string> = {
  [GigState.Open]: "Open",
  [GigState.InProgress]: "In Progress",
  [GigState.Completed]: "Completed",
  [GigState.Disputed]: "Disputed",
  [GigState.CancelledByClient]: "Cancelled",
  [GigState.CancelledByFreelancer]: "Cancelled",
};

export const GigStateClass: Record<GigState, string> = {
  [GigState.Open]: "status-open",
  [GigState.InProgress]: "status-inprogress",
  [GigState.Completed]: "status-completed",
  [GigState.Disputed]: "status-disputed",
  [GigState.CancelledByClient]: "status-cancelled",
  [GigState.CancelledByFreelancer]: "status-cancelled",
};

// ─── BADGE TYPES ───────────────────────────────────────────────────────────
export enum BadgeType {
  COMPLETED_GIGS = 0,
  EARNINGS_MILESTONE = 1,
  STREAK = 2,
  DISPUTE_FREE = 3,
  INITIATIVE = 4,
  SPECIAL = 5,
}

export const BadgeNames: Record<BadgeType, string> = {
  [BadgeType.COMPLETED_GIGS]: "Completed Gigs",
  [BadgeType.EARNINGS_MILESTONE]: "Earnings Milestone",
  [BadgeType.STREAK]: "Winning Streak",
  [BadgeType.DISPUTE_FREE]: "Dispute Free",
  [BadgeType.INITIATIVE]: "Initiative",
  [BadgeType.SPECIAL]: "Special Award",
};

export const BadgeEmoji: Record<BadgeType, string> = {
  [BadgeType.COMPLETED_GIGS]: "🏆",
  [BadgeType.EARNINGS_MILESTONE]: "💎",
  [BadgeType.STREAK]: "🔥",
  [BadgeType.DISPUTE_FREE]: "🛡️",
  [BadgeType.INITIATIVE]: "⚡",
  [BadgeType.SPECIAL]: "⭐",
};

export const BadgeLevelColors: Record<number, string> = {
  1: "from-gray-400 to-gray-500",
  2: "from-green-400 to-green-500",
  3: "from-blue-400 to-blue-600",
  4: "from-purple-400 to-purple-600",
  5: "from-yellow-400 to-amber-500",
};

export const BadgeLevelNames: Record<number, string> = {
  1: "Bronze",
  2: "Silver",
  3: "Gold",
  4: "Platinum",
  5: "Diamond",
};

// ─── ON-CHAIN TYPES ────────────────────────────────────────────────────────
export interface Milestone {
  description: string;
  value: bigint;
  completed: boolean;
}

export interface Gig {
  gigId: bigint;
  client: string;
  freelancer: string;
  totalBudget: bigint;
  description: string;
  state: GigState;
  exists: boolean;
  completedMilestoneCount: bigint;
  token: string;
  startTime: bigint;
}

export interface GigWithMilestones extends Gig {
  milestones: Milestone[];
}

// ─── HELPERS ───────────────────────────────────────────────────────────────
export const ETH_ADDRESS = "0x0000000000000000000000000000000000000000";

export function formatEther(value: bigint, decimals = 4): string {
  const formatted = ethers.formatEther(value);
  const num = parseFloat(formatted);
  return num.toFixed(decimals).replace(/\.?0+$/, "");
}

export function shortenAddress(address: string, chars = 4): string {
  if (!address) return "";
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function isEthToken(token: string): boolean {
  return token === ETH_ADDRESS;
}

export function getTokenLabel(token: string): string {
  if (isEthToken(token)) return "ETH";
  return `${token.slice(0, 6)}...`;
}

export function stateToNumber(state: GigState): number {
  return Number(state);
}
