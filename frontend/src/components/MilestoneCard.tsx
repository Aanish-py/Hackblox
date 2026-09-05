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
      "p-4 rounded-xl border transition-all duration-200",
      milestone.completed && "border-[#23895A]/30 bg-[#E8F5EE]/40",
      gigState === GigState.Disputed && !milestone.completed && "border-red-200 bg-red-50/40",
      !milestone.completed && gigState !== GigState.Disputed && "border-[#E2E4EE] bg-white shadow-xs"
    )}>
      <div className="flex items-center gap-3">
        {/* Status icon */}
        <div className="shrink-0">
          {milestone.completed ? (
            <CheckCircle className="w-5 h-5 text-[#176B4A]" />
          ) : gigState === GigState.Disputed ? (
            <AlertTriangle className="w-5 h-5 text-red-500" />
          ) : (
            <Circle className="w-5 h-5 text-[#8A93A3]" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className={clsx(
              "font-semibold text-sm",
              milestone.completed ? "text-[#176B4A] line-through opacity-80" : "text-[#172033]"
            )}>
              Milestone {index + 1}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-[#176B4A] font-mono text-sm font-bold">
                {formatEther(milestone.value)} ETH
              </span>
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-[#8A93A3] hover:text-[#172033] transition-colors p-1"
                aria-label={expanded ? "Collapse" : "Expand"}
              >
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <p className="text-[#5F6878] text-xs mt-0.5 truncate">{milestone.description}</p>

          {milestone.completed && (
            <div className="flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3 text-[#176B4A]" />
              <span className="text-xs text-[#176B4A] font-medium">Payment released</span>
            </div>
          )}
        </div>
      </div>

      {/* Expanded actions */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-[#E2E4EE] animate-fade-in">
          <p className="text-sm text-[#172033] mb-4 bg-[#F8F8FC] p-3 rounded-lg border border-[#E2E4EE]">{milestone.description}</p>

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
              <p className="text-xs text-[#8A93A3]">No actions available in current state.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
