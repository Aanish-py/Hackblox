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
      className="glass-card p-5 block group hover:no-underline"
      id={`gig-card-${Number(gig.gigId)}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-slate-500 text-xs font-mono">#{Number(gig.gigId)}</span>
            {(isClient || isFreelancer) && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-brand-600/20 text-brand-300 border border-brand-600/30">
                {isClient ? "Your gig" : "Your contract"}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400 font-mono truncate">{gig.description}</p>
        </div>
        <span className={GigStateClass[gig.state as GigState]}>{GigStateLabel[gig.state as GigState]}</span>
      </div>

      {/* Budget */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 glass-card p-3" style={{ background: "rgba(124,58,237,0.08)" }}>
          <p className="text-xs text-slate-500 mb-0.5">Total Budget</p>
          <p className="font-display font-bold text-lg gradient-text">
            {formatEther(gig.totalBudget)} {tokenLabel}
          </p>
        </div>
        {gig.state !== GigState.Open && (
          <div className="flex-1 glass-card p-3" style={{ background: "rgba(6,182,212,0.05)" }}>
            <p className="text-xs text-slate-500 mb-0.5">Milestones</p>
            <p className="font-display font-bold text-lg text-cyan-400">
              {Number(gig.completedMilestoneCount)} done
            </p>
          </div>
        )}
      </div>

      {/* Parties */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500 flex items-center gap-1"><Users className="w-3 h-3" /> Client</span>
          <span className="font-mono text-slate-300">{shortenAddress(gig.client)}</span>
        </div>
        {gig.freelancer !== "0x0000000000000000000000000000000000000000" && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-1"><Zap className="w-3 h-3" /> Freelancer</span>
            <span className="font-mono text-slate-300">{shortenAddress(gig.freelancer)}</span>
          </div>
        )}
        {gig.startTime > 0n && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3" /> Started</span>
            <span className="text-slate-400">
              {new Date(Number(gig.startTime) * 1000).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="flex items-center justify-between pt-3 border-t border-space-500">
        <span className="text-xs text-slate-500">
          {gig.state === GigState.Open ? "Accepting bids" : gig.state === GigState.Disputed ? "⚠ Disputed" : ""}
        </span>
        <span className="text-sm text-brand-400 flex items-center gap-1 group-hover:text-brand-300 transition-colors">
          View details <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </span>
      </div>
    </Link>
  );
}
