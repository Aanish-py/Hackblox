import { Link } from "react-router-dom";
import { Clock, Users, Zap, ArrowRight } from "lucide-react";
import { type Gig, GigState, GigStateLabel, GigStateClass, formatEther, shortenAddress, isEthToken } from "../lib/types";
import clsx from "clsx";

interface GigCardProps {
  gig: Gig;
  currentAddress?: string | null;
}

export default function GigCard({ gig, currentAddress }: GigCardProps) {
  const isClient = currentAddress?.toLowerCase() === gig.client.toLowerCase();
  const isFreelancer = currentAddress?.toLowerCase() === gig.freelancer.toLowerCase();
  const tokenLabel = isEthToken(gig.token) ? "ETH" : "ERC-20";

  const progressPct = gig.completedMilestoneCount > 0n
    ? Math.min(100, Number((gig.completedMilestoneCount * 100n) / 10n)) // rough estimate
    : 0;

  return (
    <Link
      to={`/gig/${Number(gig.gigId)}`}
      className="glass-card p-5 block group hover:no-underline bg-white"
      id={`gig-card-${Number(gig.gigId)}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[#8A93A3] text-xs font-mono font-medium">#{Number(gig.gigId)}</span>
            {(isClient || isFreelancer) && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#E8F5EE] text-[#176B4A] border border-[#23895A]/30 font-medium">
                {isClient ? "Your gig" : "Your contract"}
              </span>
            )}
          </div>
          <p className="text-sm text-[#172033] font-medium line-clamp-2">{gig.description}</p>
        </div>
        <span className={GigStateClass[gig.state as GigState]}>{GigStateLabel[gig.state as GigState]}</span>
      </div>

      {/* Budget */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 bg-[#F1F2FA] border border-[#E2E4EE] rounded-lg p-3">
          <p className="text-xs text-[#5F6878] mb-0.5 font-medium">Total Budget</p>
          <p className="font-display font-bold text-lg text-[#176B4A]">
            {formatEther(gig.totalBudget)} {tokenLabel}
          </p>
        </div>
        {gig.state !== GigState.Open && (
          <div className="flex-1 bg-[#E8F5EE] border border-[#23895A]/20 rounded-lg p-3">
            <p className="text-xs text-[#176B4A] mb-0.5 font-medium">Milestones</p>
            <p className="font-display font-bold text-lg text-[#176B4A]">
              {Number(gig.completedMilestoneCount)} done
            </p>
          </div>
        )}
      </div>

      {/* Parties */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-[#5F6878] flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-[#8A93A3]" /> Client</span>
          <span className="font-mono text-[#172033] font-medium">{shortenAddress(gig.client)}</span>
        </div>
        {gig.freelancer !== "0x0000000000000000000000000000000000000000" && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#5F6878] flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-[#8A93A3]" /> Freelancer</span>
            <span className="font-mono text-[#172033] font-medium">{shortenAddress(gig.freelancer)}</span>
          </div>
        )}
        {gig.startTime > 0n && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#5F6878] flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-[#8A93A3]" /> Started</span>
            <span className="text-[#5F6878]">
              {new Date(Number(gig.startTime) * 1000).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="flex items-center justify-between pt-3 border-t border-[#E2E4EE]">
        <span className="text-xs text-[#8A93A3]">
          {gig.state === GigState.Open ? "Accepting bids" : gig.state === GigState.Disputed ? "⚠ Under dispute" : "Escrow secured"}
        </span>
        <span className="text-xs font-semibold text-[#176B4A] flex items-center gap-1 group-hover:text-[#13583C] transition-colors">
          View details <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </Link>
  );
}
