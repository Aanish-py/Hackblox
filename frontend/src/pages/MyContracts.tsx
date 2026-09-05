import { useState } from "react";
import { Link } from "react-router-dom";
import { useWallet } from "../context/WalletContext";
import { useAllGigs } from "../hooks/useGig";
import { useGigEscrowContract } from "../hooks/useContract";
import { useToast } from "../components/TransactionToast";
import MilestoneCard from "../components/MilestoneCard";
import GigCard from "../components/GigCard";
import { GigState, type Gig, type GigWithMilestones, formatEther } from "../lib/types";
import { GIGESCROW_ADDRESS } from "../lib/contracts";
import { ethers } from "ethers";
import { LayoutDashboard, Plus, AlertCircle, Loader2, ChevronDown, ChevronUp, Users } from "lucide-react";
import { useGig } from "../hooks/useGig";
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

  if (loading) return <div className="skeleton h-48 rounded-xl" />;
  if (error || !gig) return <div className="text-red-400 text-sm p-4">{error || "Gig not found"}</div>;

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
      txError(id, err instanceof Error ? err.message.slice(0, 100) : "Failed");
    }
  };

  const handleDispute = async () => {
    if (!contract || !disputeReason.trim()) return;
    const id = txPending("Raising dispute", "Confirm in MetaMask");
    try {
      const tx = await contract.raiseDispute(gig.gigId, disputeReason);
      await tx.wait();
      txSuccess(id, tx.hash);
      setShowDisputeForm(false);
      setDisputeReason("");
      refetch();
    } catch (err) {
      txError(id, err instanceof Error ? err.message.slice(0, 100) : "Failed");
    }
  };

  const handleSelectFreelancer = async (freelancerAddr: string) => {
    if (!contract) return;
    const id = txPending("Selecting freelancer", "Confirm in MetaMask");
    try {
      const tx = await contract.selectFreelancer(gig.gigId, freelancerAddr);
      await tx.wait();
      txSuccess(id, tx.hash);
      setShowBidderSelect(false);
      refetch();
    } catch (err) {
      txError(id, err instanceof Error ? err.message.slice(0, 100) : "Failed");
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

  const progress = gig.milestones.length > 0
    ? (Number(gig.completedMilestoneCount) / gig.milestones.length) * 100
    : 0;

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-slate-500 mb-2">
          <span>{Number(gig.completedMilestoneCount)}/{gig.milestones.length} milestones complete</span>
          <span>{progress.toFixed(0)}%</span>
        </div>
        <div className="milestone-progress">
          <div className="milestone-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Client actions for Open gigs */}
      {isClient && gig.state === GigState.Open && (
        <div className="glass-card p-4" style={{ background: "rgba(6,182,212,0.05)" }}>
          <button
            onClick={loadBidders}
            disabled={loadingBidders}
            id={`load-bidders-${gigId}`}
            className="btn-secondary text-sm py-2"
          >
            {loadingBidders ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
            View Bidders & Select Freelancer
          </button>

          {showBidderSelect && (
            <div className="mt-4 space-y-2 animate-fade-in">
              {bidders.length === 0 ? (
                <p className="text-slate-500 text-sm">No bids yet.</p>
              ) : (
                bidders.map((b) => (
                  <div key={b} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-space-600">
                    <span className="font-mono text-sm text-slate-300">{b}</span>
                    <button
                      onClick={() => handleSelectFreelancer(b)}
                      id={`select-freelancer-${b.slice(2, 8)}`}
                      className="btn-primary text-xs py-1.5 px-4"
                    >
                      Select
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Milestones */}
      <div className="space-y-3">
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
        <div className="glass-card p-4 border-red-500/30 animate-fade-in">
          <h3 className="text-red-400 font-semibold mb-3">Raise a Dispute</h3>
          <textarea
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            placeholder="Describe the issue clearly. This will be stored on-chain and reviewed by the arbitrator..."
            rows={4}
            className="input-field text-sm mb-3 resize-none"
            id="dispute-reason-textarea"
          />
          <div className="flex gap-3">
            <button onClick={handleDispute} id="submit-dispute-btn" className="btn-danger text-sm py-2">
              Submit Dispute
            </button>
            <button onClick={() => setShowDisputeForm(false)} className="btn-secondary text-sm py-2">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Freelancer submit work link */}
      {isFreelancer && gig.state === GigState.InProgress && (
        <Link to={`/submit-work/${gigId}`} className="btn-primary w-full text-sm py-3" id={`submit-work-link-${gigId}`}>
          Upload Deliverable for Next Milestone
        </Link>
      )}
    </div>
  );
}

export default function MyContracts() {
  const { address, isConnected } = useWallet();
  const { gigs, loading, error, refetch } = useAllGigs(100);
  const [expandedGig, setExpandedGig] = useState<number | null>(null);

  const myGigs = gigs.filter(
    (g) =>
      g.client.toLowerCase() === address?.toLowerCase() ||
      g.freelancer.toLowerCase() === address?.toLowerCase()
  );

  const clientGigs = myGigs.filter((g) => g.client.toLowerCase() === address?.toLowerCase());
  const freelancerGigs = myGigs.filter((g) => g.freelancer.toLowerCase() === address?.toLowerCase());

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-10 text-center max-w-sm">
          <p className="text-slate-400 mb-4">Connect your wallet to see your contracts.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4 page-enter">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="heading-lg mb-1">My Contracts</h1>
            <p className="text-slate-400 text-sm">{myGigs.length} contracts found for your wallet</p>
          </div>
          <Link to="/post-gig" className="btn-primary text-sm py-2" id="dashboard-post-gig-btn">
            <Plus className="w-4 h-4" /> Post Gig
          </Link>
        </div>

        {!GIGESCROW_ADDRESS && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6 text-yellow-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Contracts not deployed yet.
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {Array(3).fill(null).map((_, i) => (
              <div key={i} className="skeleton h-32 rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <div className="text-red-400 p-4 glass-card">{error}</div>
        ) : myGigs.length === 0 ? (
          <div className="text-center py-20">
            <LayoutDashboard className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 mb-2">No contracts yet</p>
            <Link to="/post-gig" className="btn-primary text-sm mt-4" id="empty-post-gig-btn">
              <Plus className="w-4 h-4" /> Post Your First Gig
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* As Client */}
            {clientGigs.length > 0 && (
              <section>
                <h2 className="heading-md mb-4 text-slate-300">Posted by You (Client)</h2>
                <div className="space-y-4">
                  {clientGigs.map((gig) => (
                    <div key={Number(gig.gigId)} className="glass-card overflow-hidden">
                      <div
                        className="p-5 cursor-pointer flex items-center justify-between"
                        onClick={() => setExpandedGig(expandedGig === Number(gig.gigId) ? null : Number(gig.gigId))}
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-slate-500 text-sm font-mono">#{Number(gig.gigId)}</span>
                          <div>
                            <p className="text-sm text-slate-300 truncate max-w-xs">{gig.description}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{formatEther(gig.totalBudget)} ETH</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`status-${["open","inprogress","completed","disputed","cancelled","cancelled"][gig.state]}`}>
                            {["Open","In Progress","Completed","Disputed","Cancelled","Cancelled"][gig.state]}
                          </span>
                          {expandedGig === Number(gig.gigId) ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                        </div>
                      </div>
                      {expandedGig === Number(gig.gigId) && (
                        <div className="border-t border-space-600 p-5 animate-fade-in">
                          <GigDetailPanel gigId={Number(gig.gigId)} address={address!} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* As Freelancer */}
            {freelancerGigs.length > 0 && (
              <section>
                <h2 className="heading-md mb-4 text-slate-300">Assigned to You (Freelancer)</h2>
                <div className="space-y-4">
                  {freelancerGigs.map((gig) => (
                    <div key={Number(gig.gigId)} className="glass-card overflow-hidden">
                      <div
                        className="p-5 cursor-pointer flex items-center justify-between"
                        onClick={() => setExpandedGig(expandedGig === Number(gig.gigId) ? null : Number(gig.gigId))}
                      >
                        <div className="flex items-center gap-4">
                          <span className="text-slate-500 text-sm font-mono">#{Number(gig.gigId)}</span>
                          <div>
                            <p className="text-sm text-slate-300 truncate max-w-xs">{gig.description}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{formatEther(gig.totalBudget)} ETH budget</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`status-${["open","inprogress","completed","disputed","cancelled","cancelled"][gig.state]}`}>
                            {["Open","In Progress","Completed","Disputed","Cancelled","Cancelled"][gig.state]}
                          </span>
                          {expandedGig === Number(gig.gigId) ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                        </div>
                      </div>
                      {expandedGig === Number(gig.gigId) && (
                        <div className="border-t border-space-600 p-5 animate-fade-in">
                          <GigDetailPanel gigId={Number(gig.gigId)} address={address!} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
