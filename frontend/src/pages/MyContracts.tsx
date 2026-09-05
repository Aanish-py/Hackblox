import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import { useAllGigs, useGig } from "../hooks/useGig";
import { useGigEscrowContract } from "../hooks/useContract";
import { useToast } from "../components/TransactionToast";
import MilestoneCard from "../components/MilestoneCard";
import DashboardShell from "../components/DashboardShell";
import { GigState, type Gig, formatEther, shortenAddress } from "../lib/types";
import { GIGESCROW_ADDRESS } from "../lib/contracts";
import {
  Plus,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Users,
  Search,
  CheckCircle2,
  Clock,
  Scale,
  ArrowUpRight,
  Briefcase,
  Layers,
} from "lucide-react";
import clsx from "clsx";

function GigDetailPanel({ gigId, address }: { gigId: number; address: string }) {
  const { gig, loading, error, refetch } = useGig(gigId);
  const contract = useGigEscrowContract();
  const { txPending, txSuccess, txError } = useToast();
  const [disputeReason, setDisputeReason] = useState("");
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [showBidderSelect, setShowBidderSelect] = useState(false);
  const [bidders, setBidders] = useState<string[]>([]);
  const [loadingBidders, setLoadingBidders] = useState(false);

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        <div className="h-4 bg-[#E2E4EE] rounded animate-pulse w-1/3" />
        <div className="h-16 bg-[#E2E4EE] rounded animate-pulse" />
      </div>
    );
  }

  if (error || !gig) {
    return (
      <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs">
        {error || "Unable to load contract details."}
      </div>
    );
  }

  const isClient = address.toLowerCase() === gig.client.toLowerCase();
  const isFreelancer = address.toLowerCase() === gig.freelancer.toLowerCase();

  const handleRelease = async (milestoneIndex: number) => {
    if (!contract) return;
    const id = txPending(`Releasing milestone ${milestoneIndex + 1}`, "Confirm in MetaMask");
    try {
      const tx = await contract.releaseMilestonePayment(gig.gigId, milestoneIndex);
      await tx.wait();
      txSuccess(id, tx.hash);
      refetch();
    } catch (err) {
      txError(id, err instanceof Error ? err.message.slice(0, 100) : "Release failed");
    }
  };

  const handleDispute = async () => {
    if (!contract || !disputeReason.trim()) return;
    const id = txPending("Submitting dispute", "Confirm in MetaMask");
    try {
      const tx = await contract.raiseDispute(gig.gigId, disputeReason);
      await tx.wait();
      txSuccess(id, tx.hash);
      setShowDisputeForm(false);
      setDisputeReason("");
      refetch();
    } catch (err) {
      txError(id, err instanceof Error ? err.message.slice(0, 100) : "Dispute submission failed");
    }
  };

  const handleSelectFreelancer = async (freelancerAddr: string) => {
    if (!contract) return;
    const id = txPending("Confirming freelancer selection", "Confirm in MetaMask");
    try {
      const tx = await contract.selectFreelancer(gig.gigId, freelancerAddr);
      await tx.wait();
      txSuccess(id, tx.hash);
      setShowBidderSelect(false);
      refetch();
    } catch (err) {
      txError(id, err instanceof Error ? err.message.slice(0, 100) : "Selection failed");
    }
  };

  const loadBidders = async () => {
    if (!contract) return;
    setLoadingBidders(true);
    try {
      const b = await contract.getBidders(gig.gigId);
      setBidders(b as string[]);
      setShowBidderSelect(true);
    } finally {
      setLoadingBidders(false);
    }
  };

  const progress =
    gig.milestones.length > 0
      ? (Number(gig.completedMilestoneCount) / gig.milestones.length) * 100
      : 0;

  return (
    <div className="space-y-4 pt-2">
      {/* Milestone Progress Bar */}
      <div className="p-3.5 rounded-xl bg-white border border-[#E2E4EE] shadow-xs">
        <div className="flex justify-between items-center text-xs font-mono text-[#5F6878] mb-2 font-medium">
          <span>
            {Number(gig.completedMilestoneCount)} / {gig.milestones.length} Milestones Settled
          </span>
          <span className="text-[#176B4A] font-semibold">{progress.toFixed(0)}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-[#E2E4EE] overflow-hidden">
          <div
            className="h-full bg-[#176B4A] rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Client action: Select bidder for open gigs */}
      {isClient && gig.state === GigState.Open && (
        <div className="p-4 rounded-xl bg-white border border-[#E2E4EE] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#172033] font-semibold">Freelancer Selection</span>
            <button
              onClick={loadBidders}
              disabled={loadingBidders}
              id={`load-bidders-${gigId}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F1F2FA] hover:bg-[#E2E4EE] text-[#172033] border border-[#E2E4EE] text-xs font-medium transition-colors"
            >
              {loadingBidders ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Users className="w-3.5 h-3.5 text-[#176B4A]" />
              )}
              <span>{showBidderSelect ? "Refresh Bidders" : "View Proposals & Select"}</span>
            </button>
          </div>

          {showBidderSelect && (
            <div className="mt-3 pt-3 border-t border-[#E2E4EE] space-y-2">
              {bidders.length === 0 ? (
                <p className="text-xs text-[#5F6878] py-1">No freelancer proposals submitted yet.</p>
              ) : (
                bidders.map((b) => (
                  <div
                    key={b}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#F8F8FC] border border-[#E2E4EE]"
                  >
                    <span className="font-mono text-xs text-[#172033] truncate max-w-[200px]">{b}</span>
                    <button
                      onClick={() => handleSelectFreelancer(b)}
                      id={`select-freelancer-${b.slice(2, 8)}`}
                      className="px-3 py-1.5 rounded-lg bg-[#176B4A] hover:bg-[#13583C] text-white text-xs font-medium transition-colors shadow-xs"
                    >
                      Assign Work
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Milestones list */}
      <div className="space-y-2.5">
        <span className="text-[11px] font-mono uppercase tracking-wider text-[#8A93A3] font-semibold block px-1">
          Milestones Breakdown
        </span>
        {gig.milestones.map((ms, i) => (
          <MilestoneCard
            key={i}
            milestone={ms}
            index={i}
            gigId={gig.gigId}
            gigState={gig.state}
            isClient={isClient}
            isFreelancer={isFreelancer}
            onRelease={handleRelease}
            onDispute={() => setShowDisputeForm(true)}
          />
        ))}
      </div>

      {/* Dispute form */}
      {showDisputeForm && gig.state === GigState.InProgress && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 space-y-3">
          <div className="flex items-center gap-2 text-red-800 text-xs font-semibold">
            <Scale className="w-4 h-4 text-red-600" />
            <span>Raise Formal Dispute</span>
          </div>
          <p className="text-[11px] text-red-700 leading-relaxed">
            Submit a documented explanation. Evidence will be logged on-chain and reviewed in arbitration.
          </p>
          <textarea
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            placeholder="Explain the contested milestone or delivery failure..."
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-white border border-red-200 text-xs text-[#172033] placeholder:text-[#8A93A3] outline-none focus:border-red-500"
            id="dispute-reason-textarea"
          />
          <div className="flex gap-2">
            <button
              onClick={handleDispute}
              id="submit-dispute-btn"
              className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-medium transition-colors shadow-xs"
            >
              Submit Dispute
            </button>
            <button
              onClick={() => setShowDisputeForm(false)}
              className="px-3.5 py-1.5 rounded-lg border border-[#E2E4EE] bg-white text-[#5F6878] hover:text-[#172033] text-xs font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Freelancer submit work link */}
      {isFreelancer && gig.state === GigState.InProgress && (
        <div className="pt-2">
          <Link
            to={`/submit-work/${gigId}`}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#176B4A] hover:bg-[#13583C] text-white text-xs font-medium transition-colors shadow-xs"
            id={`submit-work-link-${gigId}`}
          >
            <span>Upload Deliverable Artifacts (IPFS)</span>
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* If disputed, link to dispute center */}
      {gig.state === GigState.Disputed && (
        <div className="pt-1">
          <Link
            to={`/dispute/${gigId}`}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-red-50 border border-red-200 text-red-800 hover:bg-red-100 text-xs font-semibold transition-colors"
          >
            <Scale className="w-3.5 h-3.5 text-red-600" />
            <span>Open Dispute Arbitration Center</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-red-600" />
          </Link>
        </div>
      )}
    </div>
  );
}

export default function MyContracts() {
  const { address, isAuthenticated, isAuthChecking, profile } = useWallet();
  const { gigs, loading, error, refetch } = useAllGigs(100);
  const [expandedGig, setExpandedGig] = useState<number | null>(null);
  const [roleFilter, setRoleFilter] = useState<"all" | "client" | "freelancer">("all");

  // STATE 1: Session initializing
  if (isAuthChecking) {
    return (
      <DashboardShell>
        <div className="space-y-6">
          <div className="pb-2 border-b border-[#E2E4EE] space-y-2">
            <div className="h-7 w-48 bg-[#F1F2FA] rounded animate-pulse" />
            <div className="h-4 w-72 bg-[#F1F2FA] rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array(4)
              .fill(null)
              .map((_, i) => (
                <div key={i} className="h-24 rounded-xl border border-[#E2E4EE] bg-white animate-pulse" />
              ))}
          </div>
          <div className="h-36 rounded-xl border border-[#E2E4EE] bg-white animate-pulse" />
          <div className="h-64 rounded-xl border border-[#E2E4EE] bg-white animate-pulse" />
        </div>
      </DashboardShell>
    );
  }

  // STATE 2: Not authenticated
  if (!isAuthenticated || !address) {
    return <Navigate to="/auth?returnTo=%2Fmy-contracts" replace />;
  }

  const myGigs = gigs.filter(
    (g) =>
      g.client.toLowerCase() === address.toLowerCase() ||
      g.freelancer.toLowerCase() === address.toLowerCase()
  );

  const clientGigs = myGigs.filter((g) => g.client.toLowerCase() === address.toLowerCase());
  const freelancerGigs = myGigs.filter((g) => g.freelancer.toLowerCase() === address.toLowerCase());

  // Metrics derived exclusively from real on-chain contract records
  const activeCount = myGigs.filter((g) => g.state === GigState.InProgress).length;
  const completedCount = myGigs.filter((g) => g.state === GigState.Completed).length;
  const disputedCount = myGigs.filter((g) => g.state === GigState.Disputed).length;

  const displayedGigs =
    roleFilter === "client"
      ? clientGigs
      : roleFilter === "freelancer"
      ? freelancerGigs
      : myGigs;

  // Identify most relevant active contract for the compact escrow execution pipeline
  const activeContract =
    myGigs.find((g) => g.state === GigState.InProgress) ||
    myGigs.find((g) => g.state === GigState.Open) ||
    myGigs.find((g) => g.state === GigState.Disputed) ||
    myGigs[0];

  // Derive real pending actions strictly from existing contract data
  const pendingActions: {
    id: string;
    gigId: number;
    title: string;
    type: "review" | "submit" | "select" | "dispute";
    actionLabel: string;
    actionLink: string;
  }[] = [];

  myGigs.forEach((g) => {
    const isClient = g.client.toLowerCase() === address?.toLowerCase();
    const isFreelancer = g.freelancer.toLowerCase() === address?.toLowerCase();

    if (g.state === GigState.Open && isClient) {
      pendingActions.push({
        id: `select-${g.gigId}`,
        gigId: Number(g.gigId),
        title: `Proposals open for assignment: ${g.description.slice(0, 40)}...`,
        type: "select",
        actionLabel: "Review Bidders",
        actionLink: `/my-contracts`,
      });
    } else if (g.state === GigState.InProgress && isFreelancer) {
      pendingActions.push({
        id: `submit-${g.gigId}`,
        gigId: Number(g.gigId),
        title: `Milestone deliverable pending: ${g.description.slice(0, 40)}...`,
        type: "submit",
        actionLabel: "Upload Work (IPFS)",
        actionLink: `/submit-work/${g.gigId}`,
      });
    } else if (g.state === GigState.InProgress && isClient) {
      pendingActions.push({
        id: `review-${g.gigId}`,
        gigId: Number(g.gigId),
        title: `Active contract in milestone delivery: ${g.description.slice(0, 40)}...`,
        type: "review",
        actionLabel: "View Milestones",
        actionLink: `/my-contracts`,
      });
    } else if (g.state === GigState.Disputed) {
      pendingActions.push({
        id: `dispute-${g.gigId}`,
        gigId: Number(g.gigId),
        title: `Dispute filed on Gig #${g.gigId}. Arbitration required.`,
        type: "dispute",
        actionLabel: "Open Dossier",
        actionLink: `/dispute/${g.gigId}`,
      });
    }
  });

  // Calculate compact pipeline stage for the active contract
  const getPipelineStage = (gig: Gig) => {
    if (gig.state === GigState.Open) return 1; // Deposit locked
    if (gig.state === GigState.InProgress) {
      const completed = Number(gig.completedMilestoneCount);
      const total = gig.milestones.length;
      if (completed === 0) return 2; // Milestone execution
      if (completed < total) return 3; // Deliverable submission / in review
      return 4; // Final review
    }
    if (gig.state === GigState.Disputed) return 4; // Review / Arbitration
    if (gig.state === GigState.Completed) return 5; // Released / Settled
    return 1;
  };

  // State badge map
  const stateBadgeMap: Record<number, { label: string; style: string }> = {
    [GigState.Open]: { label: "Open", style: "bg-[#E8F5EE] text-[#176B4A] border-[#23895A]/30" },
    [GigState.InProgress]: { label: "In Progress", style: "bg-[#FEF3C7] text-[#92400E] border-[#F59E0B]/30" },
    [GigState.Completed]: { label: "Completed", style: "bg-[#E8F5EE] text-[#176B4A] border-[#176B4A]/30" },
    [GigState.Disputed]: { label: "Disputed", style: "bg-[#FEE2E2] text-[#991B1B] border-[#EF4444]/30" },
    [GigState.CancelledByClient]: { label: "Cancelled", style: "bg-[#F1F2FA] text-[#5F6878] border-[#E2E4EE]" },
    [GigState.CancelledByFreelancer]: { label: "Cancelled", style: "bg-[#F1F2FA] text-[#5F6878] border-[#E2E4EE]" },
  };

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Title & Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E2E4EE]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-[#172033] tracking-tight">
                Dashboard Overview
              </h1>
              {profile?.displayName && profile.displayName.trim().length > 0 ? (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#E8F5EE] text-[#176B4A] border border-[#23895A]/30">
                  {profile.displayName}
                </span>
              ) : (
                <Link
                  to="/profile"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors"
                >
                  <AlertCircle className="w-3 h-3 text-amber-600" />
                  <span>Profile setup required</span>
                </Link>
              )}
            </div>
            <p className="text-xs text-[#5F6878]">
              Live escrow pipeline, milestone commitments, and fund settlements.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Link
              to="/browse"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-[#E2E4EE] bg-white hover:bg-[#F1F2FA] text-[#172033] text-xs font-semibold transition-colors shadow-xs"
            >
              <Search className="w-3.5 h-3.5 text-[#8A93A3]" />
              <span>Browse Gigs</span>
            </Link>
            <Link
              to="/post-gig"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#176B4A] hover:bg-[#13583C] text-white text-xs font-semibold transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 text-white" />
              <span>Post a Gig</span>
            </Link>
          </div>
        </div>

        {/* Missing contract deployment warning (if any) */}
        {!GIGESCROW_ADDRESS && (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-3">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>
              Contract addresses not configured for Sepolia. Ensure Hardhat deployment script has run.
            </span>
          </div>
        )}

        {/* Loading / Error / Content */}
        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {Array(4)
                .fill(null)
                .map((_, i) => (
                  <div key={i} className="h-24 rounded-xl border border-[#E2E4EE] bg-white animate-pulse" />
                ))}
            </div>
            <div className="h-32 rounded-xl border border-[#E2E4EE] bg-white animate-pulse" />
            <div className="h-48 rounded-xl border border-[#E2E4EE] bg-white animate-pulse" />
          </div>
        ) : error ? (
          <div className="p-6 rounded-xl border border-red-200 bg-red-50 text-red-900 text-xs">
            <div className="flex items-center gap-2 text-red-700 font-semibold mb-1">
              <AlertCircle className="w-4 h-4" />
              <span>Failed to load contracts from Ethereum Sepolia</span>
            </div>
            <p className="text-[#5F6878] font-mono text-[11px] mb-4 bg-white p-2.5 rounded border border-red-100 break-all">
              {error}
            </p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 rounded-lg bg-white hover:bg-[#F1F2FA] border border-[#E2E4EE] text-xs font-semibold text-[#172033] transition-colors"
            >
              Retry Contract Query
            </button>
          </div>
        ) : (
          <>
            {/* KPI Summary Cards (Real metrics only) */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-[#E2E4EE] bg-white shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase text-[#8A93A3]">Total Contracts</span>
                  <Layers className="w-4 h-4 text-[#8A93A3]" />
                </div>
                <div className="text-2xl font-bold font-mono text-[#172033]">
                  {myGigs.length}
                </div>
                <p className="text-[11px] text-[#5F6878] mt-1">Associated with this wallet</p>
              </div>

              <div className="p-4 rounded-xl border border-[#E2E4EE] bg-white shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase text-[#8A93A3]">In Progress</span>
                  <Clock className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-2xl font-bold font-mono text-amber-800">
                  {activeCount}
                </div>
                <p className="text-[11px] text-[#5F6878] mt-1">Active milestone execution</p>
              </div>

              <div className="p-4 rounded-xl border border-[#E2E4EE] bg-white shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase text-[#8A93A3]">Completed</span>
                  <CheckCircle2 className="w-4 h-4 text-[#176B4A]" />
                </div>
                <div className="text-2xl font-bold font-mono text-[#176B4A]">
                  {completedCount}
                </div>
                <p className="text-[11px] text-[#5F6878] mt-1">All milestones settled</p>
              </div>

              <div className="p-4 rounded-xl border border-[#E2E4EE] bg-white shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase text-[#8A93A3]">Contested</span>
                  <Scale className="w-4 h-4 text-red-500" />
                </div>
                <div className="text-2xl font-bold font-mono text-red-700">
                  {disputedCount}
                </div>
                <p className="text-[11px] text-[#5F6878] mt-1">Requires arbitration</p>
              </div>
            </div>

            {/* COMPACT ESCROW EXECUTION PIPELINE COMPONENT */}
            {activeContract ? (
              <div className="p-5 rounded-xl border border-[#E2E4EE] bg-white shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E2E4EE]">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#176B4A]" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                      Escrow Execution Pipeline · Gig #{Number(activeContract.gigId)}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#5F6878]">
                    <span className="font-semibold text-[#172033] truncate max-w-xs">{activeContract.description}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E8F5EE] text-[#176B4A]">
                      {activeContract.client.toLowerCase() === address?.toLowerCase() ? "Client" : "Freelancer"}
                    </span>
                  </div>
                </div>

                {/* 5-Step Pipeline visualization */}
                {(() => {
                  const currentStage = getPipelineStage(activeContract);
                  const stages = [
                    { step: 1, name: "Deposit", desc: "Funds locked in escrow" },
                    { step: 2, name: "Milestone", desc: "Work in execution" },
                    { step: 3, name: "Deliverable", desc: "IPFS proof submitted" },
                    { step: 4, name: "Review", desc: "Client verification" },
                    { step: 5, name: "Release", desc: "Payment settled" },
                  ];

                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-1">
                      {stages.map(({ step, name, desc }) => {
                        const isCompleted = currentStage > step;
                        const isCurrent = currentStage === step;

                        return (
                          <div
                            key={step}
                            className={clsx(
                              "p-3 rounded-lg border transition-all",
                              isCurrent
                                ? "bg-[#E8F5EE] border-[#176B4A] shadow-xs"
                                : isCompleted
                                ? "bg-white border-[#E2E4EE]"
                                : "bg-[#F8F8FC] border-[#E2E4EE] opacity-60"
                            )}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span
                                className={clsx(
                                  "w-5 h-5 rounded-full text-[11px] font-bold flex items-center justify-center font-mono",
                                  isCurrent
                                    ? "bg-[#176B4A] text-white"
                                    : isCompleted
                                    ? "bg-[#E8F5EE] text-[#176B4A] border border-[#23895A]/30"
                                    : "bg-[#E2E4EE] text-[#8A93A3]"
                                )}
                              >
                                {isCompleted ? "✓" : step}
                              </span>
                              {isCurrent && (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-[#176B4A]">
                                  Active
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-bold text-[#172033]">{name}</p>
                            <p className="text-[10px] text-[#5F6878] mt-0.5 leading-tight">{desc}</p>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="p-6 rounded-xl border border-[#E2E4EE] bg-white shadow-xs text-center space-y-3">
                <div className="flex items-center justify-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#8A93A3]" />
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[#5F6878]">
                    Escrow Execution Pipeline
                  </h2>
                </div>
                <h3 className="text-sm font-bold text-[#172033]">
                  No active contracts
                </h3>
                <p className="text-xs text-[#5F6878] max-w-sm mx-auto leading-relaxed">
                  You do not have any active escrow contracts running on Sepolia. Once you post a project or get assigned to a gig, the live settlement pipeline will track your funds here.
                </p>
                <div className="flex items-center justify-center gap-2.5 pt-1">
                  <Link
                    to="/browse"
                    className="px-3.5 py-1.5 rounded-lg border border-[#E2E4EE] bg-white hover:bg-[#F1F2FA] text-[#172033] text-xs font-semibold transition-colors shadow-xs"
                  >
                    Browse Gigs
                  </Link>
                  <Link
                    to="/post-gig"
                    className="px-3.5 py-1.5 rounded-lg bg-[#176B4A] hover:bg-[#13583C] text-white text-xs font-semibold transition-colors shadow-xs"
                  >
                    Post a Gig
                  </Link>
                </div>
              </div>
            )}

            {/* PENDING ACTIONS (SURFACED WHEN REAL ACTIONS ARE REQUIRED) */}
            {pendingActions.length > 0 && (
              <div className="p-5 rounded-xl border border-amber-200 bg-amber-50/40 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-700" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-amber-950">
                      Pending Workspace Actions ({pendingActions.length})
                    </h2>
                  </div>
                  <span className="text-[11px] text-amber-800">Requires interaction</span>
                </div>

                <div className="space-y-2">
                  {pendingActions.slice(0, 3).map((act) => (
                    <div
                      key={act.id}
                      className="p-3 rounded-lg bg-white border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500" />
                        <span className="text-xs font-semibold text-[#172033]">{act.title}</span>
                      </div>
                      <Link
                        to={act.actionLink}
                        onClick={() => setExpandedGig(act.gigId)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#176B4A] hover:bg-[#13583C] text-white text-xs font-semibold transition-colors shrink-0"
                      >
                        <span>{act.actionLabel}</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Role Selector Tabs & Contract List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#E2E4EE] pb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setRoleFilter("all")}
                    className={clsx(
                      "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                      roleFilter === "all"
                        ? "bg-[#E8F5EE] text-[#176B4A] border border-[#23895A]/30 shadow-xs"
                        : "text-[#5F6878] hover:text-[#172033] hover:bg-[#F1F2FA]"
                    )}
                  >
                    All ({myGigs.length})
                  </button>
                  <button
                    onClick={() => setRoleFilter("client")}
                    className={clsx(
                      "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                      roleFilter === "client"
                        ? "bg-[#E8F5EE] text-[#176B4A] border border-[#23895A]/30 shadow-xs"
                        : "text-[#5F6878] hover:text-[#172033] hover:bg-[#F1F2FA]"
                    )}
                  >
                    As Client ({clientGigs.length})
                  </button>
                  <button
                    onClick={() => setRoleFilter("freelancer")}
                    className={clsx(
                      "px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors",
                      roleFilter === "freelancer"
                        ? "bg-[#E8F5EE] text-[#176B4A] border border-[#23895A]/30 shadow-xs"
                        : "text-[#5F6878] hover:text-[#172033] hover:bg-[#F1F2FA]"
                    )}
                  >
                    As Freelancer ({freelancerGigs.length})
                  </button>
                </div>
              </div>

              {/* Empty or Populated List */}
              {displayedGigs.length === 0 ? (
                <div className="p-12 text-center rounded-xl border border-[#E2E4EE] bg-white shadow-xs">
                  <Briefcase className="w-10 h-10 text-[#8A93A3] mx-auto mb-3" />
                  <h3 className="text-base font-bold text-[#172033] mb-1">
                    {myGigs.length === 0
                      ? "No active contracts found for this wallet."
                      : roleFilter === "client"
                      ? "No contracts found as client"
                      : "No contracts found as freelancer"}
                  </h3>
                  <p className="text-xs text-[#5F6878] max-w-sm mx-auto mb-5 leading-relaxed">
                    {myGigs.length === 0
                      ? `No active contracts found for wallet ${shortenAddress(address, 4)}. Browse open gigs to submit proposals or post a new project to initialize an escrow contract.`
                      : roleFilter === "client"
                      ? "You haven't posted any gigs as a client yet. Post a project to lock funds into escrow."
                      : "You haven't been assigned to any contracts yet. Browse open gigs to submit proposals."}
                  </p>
                  <div className="flex items-center justify-center gap-3">
                    <Link
                      to="/browse"
                      className="px-4 py-2 rounded-lg border border-[#E2E4EE] bg-white hover:bg-[#F1F2FA] text-[#172033] text-xs font-semibold transition-colors shadow-xs"
                    >
                      Browse Gigs
                    </Link>
                    <Link
                      to="/post-gig"
                      className="px-4 py-2 rounded-lg bg-[#176B4A] hover:bg-[#13583C] text-white text-xs font-semibold transition-colors shadow-xs"
                    >
                      Post a Gig
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {displayedGigs.map((gig) => {
                    const isExpanded = expandedGig === Number(gig.gigId);
                    const badge = stateBadgeMap[gig.state] || {
                      label: "Unknown",
                      style: "bg-[#F1F2FA] text-[#5F6878] border-[#E2E4EE]",
                    };
                    const isClient = gig.client.toLowerCase() === address?.toLowerCase();

                    return (
                      <div
                        key={Number(gig.gigId)}
                        className="rounded-xl border border-[#E2E4EE] bg-white overflow-hidden transition-all hover:border-[#CBD2DE] shadow-xs"
                      >
                        <div
                          className="p-4 sm:p-5 flex items-center justify-between gap-4 cursor-pointer"
                          onClick={() => setExpandedGig(isExpanded ? null : Number(gig.gigId))}
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <span className="font-mono text-xs text-[#176B4A] font-bold shrink-0">
                              #{Number(gig.gigId)}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-[#172033] truncate max-w-sm sm:max-w-md">
                                  {gig.description}
                                </p>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#F1F2FA] text-[#5F6878] border border-[#E2E4EE] font-semibold shrink-0">
                                  {isClient ? "Client" : "Freelancer"}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-[#5F6878] mt-1 font-mono">
                                <span className="font-semibold text-[#176B4A]">{formatEther(gig.totalBudget)} ETH</span>
                                <span>·</span>
                                <span>{Number(gig.completedMilestoneCount)} of {gig.milestones.length} milestones settled</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <span
                              className={clsx(
                                "px-2.5 py-0.5 rounded-full text-[11px] font-semibold border",
                                badge.style
                              )}
                            >
                              {badge.label}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-[#8A93A3]" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-[#8A93A3]" />
                            )}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-t border-[#E2E4EE] p-4 sm:p-5 bg-[#F8F8FC]">
                            <GigDetailPanel gigId={Number(gig.gigId)} address={address!} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}

