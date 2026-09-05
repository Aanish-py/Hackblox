import { ethers } from "ethers";
import { CheckCircle, Circle, Clock, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { GigState, type Milestone, formatEther } from "../lib/types";
import clsx from "clsx";

interface MilestoneCardProps {
  milestone: Milestone;
  index: number;
  gigId: bigint;
  gigState: GigState;
  isClient: boolean;
  isFreelancer: boolean;
  onRelease: (index: number) => Promise<void>;
  onDispute: () => void;
}

export default function MilestoneCard({
  milestone,
  index,
  gigId,
  gigState,
  isClient,
  isFreelancer,
  onRelease,
  onDispute,
}: MilestoneCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [releasing, setReleasing] = useState(false);

  const canRelease =
    isClient &&
    !milestone.completed &&
    gigState === GigState.InProgress;

  const canDispute =
    (isClient || isFreelancer) &&
    gigState === GigState.InProgress;

  const handleRelease = async () => {
    setReleasing(true);
    try {
      await onRelease(index);
    } finally {
      setReleasing(false);
    }
  };

  return (
    <div className={clsx(
      "glass-card p-4 transition-all duration-300",
      milestone.completed && "border-green-500/30 bg-green-500/5",
      gigState === GigState.Disputed && !milestone.completed && "border-red-500/20"
    )}>
      <div className="flex items-center gap-3">
        {/* Status icon */}
        <div className="shrink-0">
          {milestone.completed ? (
            <CheckCircle className="w-6 h-6 text-green-400" />
          ) : gigState === GigState.Disputed ? (
            <AlertTriangle className="w-6 h-6 text-red-400" />
          ) : (
            <Circle className="w-6 h-6 text-slate-600" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className={clsx(
              "font-semibold text-sm",
              milestone.completed ? "text-green-300 line-through opacity-70" : "text-white"
            )}>
              Milestone {index + 1}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-brand-300 font-mono text-sm font-bold">
                {formatEther(milestone.value)} ETH
              </span>
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-slate-500 hover:text-slate-300 transition-colors"
                aria-label={expanded ? "Collapse" : "Expand"}
              >
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <p className="text-slate-400 text-xs mt-0.5 truncate">{milestone.description}</p>

          {milestone.completed && (
            <div className="flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3 text-green-400" />
              <span className="text-xs text-green-400">Payment released</span>
            </div>
          )}
        </div>
      </div>

      {/* Expanded actions */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-space-500 animate-fade-in">
          <p className="text-sm text-slate-300 mb-4">{milestone.description}</p>

          <div className="flex gap-3 flex-wrap">
            {canRelease && (
              <button
                onClick={handleRelease}
                disabled={releasing}
                id={`release-milestone-${Number(gigId)}-${index}`}
                className="btn-success text-sm py-2 px-4"
              >
                {releasing ? (
                  <><Clock className="w-4 h-4 animate-spin" /> Releasing...</>
                ) : (
                  <><CheckCircle className="w-4 h-4" /> Release Payment</>
                )}
              </button>
            )}

            {canDispute && (
              <button
                onClick={onDispute}
                id={`dispute-milestone-${Number(gigId)}-${index}`}
                className="btn-danger text-sm py-2 px-4"
              >
                <AlertTriangle className="w-4 h-4" />
                Raise Dispute
              </button>
            )}

            {!canRelease && !canDispute && !milestone.completed && (
              <p className="text-xs text-slate-500">No actions available in current state.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
