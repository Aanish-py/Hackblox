import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Loader2,
  ExternalLink,
  Shield,
  Brain,
  CheckCircle,
  XCircle,
  FileText,
  ArrowLeft,
  Send,
  Lock,
  Clock,
} from "lucide-react";
import { useWallet } from "../context/WalletContext";
import { useGig } from "../hooks/useGig";
import { useGigEscrowContract } from "../hooks/useContract";
import { useArbitrator } from "../hooks/useArbitrator";
import { useToast } from "../components/TransactionToast";
import DashboardShell from "../components/DashboardShell";
import api from "../lib/api";
import { GigState, shortenAddress } from "../lib/types";
import { getGigRole, GigRoleLabel, getRoleBadgeClass } from "../lib/roles";

interface DisputeData {
  id: string;
  gigId: number;
  raisedBy: string;
  reason: string;
  state: string;
  aiRecommendation?: {
    recommendation: string;
    confidence: number;
    reasoning: string;
    suggested_resolution: string;
  };
  evidence: { id: string; submittedBy: string; content: string; ipfsHash?: string; createdAt: string }[];
  createdAt: string;
}

// ─── Access-Denied State ──────────────────────────────────────────────────────

function DisputeAccessDenied() {
  const navigate = useNavigate();
  return (
    <DashboardShell>
      <div className="max-w-md mx-auto my-16">
        <div className="bg-white border border-[#E2E4EE] rounded-2xl p-10 text-center shadow-sm space-y-5">
          <div className="w-14 h-14 rounded-full bg-[#F1F2FA] border border-[#E2E4EE] flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7 text-[#5F6878]" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-bold text-[#172033] tracking-tight">
              Dispute access restricted
            </h2>
            <p className="text-sm text-[#5F6878] leading-relaxed">
              This case is limited to its participants and the GigChain protocol
              arbitrator. On-chain data remains publicly observable on-chain,
              but the GigChain application restricts dispute workspace access to
              authorized parties only.
            </p>
          </div>
          <button
            onClick={() => navigate("/my-contracts")}
            id="access-denied-back-btn"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#176B4A] hover:bg-[#13583C] text-white text-sm font-semibold transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>
      </div>
    </DashboardShell>
  );
}

// ─── Arbitrator Role Loading State ────────────────────────────────────────────

function DisputeRoleChecking() {
  return (
    <DashboardShell>
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="w-8 h-8 text-[#176B4A] animate-spin" />
        <p className="text-xs text-[#5F6878]">Checking arbitration role…</p>
      </div>
    </DashboardShell>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DisputeDetails() {
  const { gigId } = useParams<{ gigId: string }>();
  const navigate = useNavigate();
  const { address } = useWallet();
  const { gig, loading: gigLoading } = useGig(gigId ? parseInt(gigId) : null);
  const contract = useGigEscrowContract();
  const { arbitratorAddress, loading: arbitratorLoading, error: arbitratorError } = useArbitrator();
  const { txPending, txSuccess, txError } = useToast();
  const [dispute, setDispute] = useState<DisputeData | null>(null);
  const [loadingDispute, setLoadingDispute] = useState(true);
  const [evidenceText, setEvidenceText] = useState("");
  const [submittingEvidence, setSubmittingEvidence] = useState(false);
  const [analyzingAI, setAnalyzingAI] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolveToFreelancer, setResolveToFreelancer] = useState<boolean | null>(null);

  useEffect(() => {
    if (!gigId) return;
    api
      .get(`/disputes/${gigId}`)
      .then((r) => setDispute(r.data))
      .catch(() => setDispute(null))
      .finally(() => setLoadingDispute(false));
  }, [gigId]);

  const submitEvidence = async () => {
    if (!address || !gigId || !evidenceText.trim()) return;
    setSubmittingEvidence(true);
    try {
      await api.put(`/disputes/${gigId}/evidence`, { content: evidenceText, submittedBy: address });
      const r = await api.get(`/disputes/${gigId}`);
      setDispute(r.data);
      setEvidenceText("");
    } finally {
      setSubmittingEvidence(false);
    }
  };

  const triggerAIAnalysis = async () => {
    if (!gigId) return;
    setAnalyzingAI(true);
    try {
      const r = await api.post("/ai/analyze-dispute", { gigId });
      setDispute((d) => (d ? { ...d, aiRecommendation: r.data } : d));
    } finally {
      setAnalyzingAI(false);
    }
  };

  const handleResolve = async (toFreelancer: boolean) => {
    if (!contract || !gig) return;
    setResolving(true);
    setResolveToFreelancer(toFreelancer);
    const id = txPending("Resolving dispute", "Confirm in MetaMask");
    try {
      const resolutionData = new TextEncoder().encode(JSON.stringify(dispute?.aiRecommendation || {}));
      const tx = await contract.submitDisputeResolution(gig.gigId, toFreelancer, resolutionData);
      await tx.wait();
      txSuccess(id, tx.hash);
    } catch (err) {
      txError(id, err instanceof Error ? err.message.slice(0, 100) : "Failed");
    } finally {
      setResolving(false);
    }
  };

  // ── Phase 1: Loading — gig data or arbitrator address still resolving ──────
  // Show a neutral loading state. Do NOT render dispute data until role is known.
  const isResolvingRole = gigLoading || loadingDispute || arbitratorLoading;

  if (isResolvingRole) {
    return <DisputeRoleChecking />;
  }

  // ── Phase 2: Gig not found ────────────────────────────────────────────────
  if (!gig) {
    return (
      <DashboardShell>
        <div className="bg-white border border-[#E2E4EE] rounded-xl p-10 text-center max-w-md mx-auto my-12 shadow-xs">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-base font-bold text-[#172033] mb-1">Gig Not Found</p>
          <p className="text-xs text-[#5F6878] mb-4">
            The dispute contract could not be loaded from on-chain storage.
          </p>
          <button
            onClick={() => navigate("/my-contracts")}
            className="px-4 py-2 rounded-lg bg-white border border-[#E2E4EE] text-xs font-semibold text-[#172033]"
          >
            Back to Dashboard
          </button>
        </div>
      </DashboardShell>
    );
  }

  // ── Phase 3: Not in disputed state ───────────────────────────────────────
  if (gig.state !== GigState.Disputed) {
    return (
      <DashboardShell>
        <div className="bg-white border border-[#E2E4EE] rounded-xl p-10 text-center max-w-md mx-auto my-12 shadow-xs">
          <Shield className="w-10 h-10 text-[#176B4A] mx-auto mb-3" />
          <p className="text-base font-bold text-[#172033] mb-1">No Active Dispute</p>
          <p className="text-xs text-[#5F6878] mb-4">
            Gig #{gigId} is currently not in a disputed state on the escrow smart contract.
          </p>
          <button
            onClick={() => navigate("/my-contracts")}
            className="px-4 py-2 rounded-lg bg-[#176B4A] text-white text-xs font-semibold"
          >
            Back to Overview
          </button>
        </div>
      </DashboardShell>
    );
  }

  // ── Phase 4: Role determination ──────────────────────────────────────────
  // All data is loaded. Now determine the current wallet's role for this gig.
  const role = getGigRole(gig, address, arbitratorAddress);

  // UNRELATED wallets — access denied, no dispute data rendered
  if (role === "UNRELATED") {
    return <DisputeAccessDenied />;
  }

  // ── Phase 5: Arbitrator error warning (still show dispute to parties) ────
  // If arbitrator lookup failed but role is confirmed as CLIENT or FREELANCER,
  // show the dispute normally but include a warning about arbitrator status.

  const isArbitrator = role === "ARBITRATOR";
  const isParty = role === "CLIENT" || role === "FREELANCER";

  // ─── Render full dispute view for authorized parties ──────────────────────
  return (
    <DashboardShell>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="pb-3 border-b border-[#E2E4EE]">
          <button
            onClick={() => navigate("/my-contracts")}
            className="inline-flex items-center gap-1.5 text-xs text-[#5F6878] hover:text-[#172033] mb-3 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#172033] tracking-tight">
                  Arbitration Dossier · Gig #{gigId}
                </h1>
                <p className="text-xs text-[#5F6878] mt-0.5">
                  Escrow locked pending evidence review and arbitrator resolution.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center">
              {/* Role badge */}
              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${getRoleBadgeClass(role)}`}
              >
                {GigRoleLabel[role]}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                Active Dispute
              </span>
            </div>
          </div>
        </div>

        {/* Arbitrator error notice (advisory) */}
        {arbitratorError && !isArbitrator && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <span>
              Unable to determine arbitration authority: {arbitratorError}. Arbitration controls
              are hidden until the arbitrator address can be confirmed from the contract.
            </span>
          </div>
        )}

        {/* Stage 1: Dispute Details & Context */}
        <div className="bg-white border border-[#E2E4EE] rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#E2E4EE]">
            <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 text-xs font-bold flex items-center justify-center">
              1
            </span>
            <h2 className="text-sm font-bold text-[#172033]">Dispute Claim & Parties</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-[#F8F8FC] border border-[#E2E4EE] rounded-lg">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A93A3] block mb-1">
                Client Address
              </span>
              <span
                className="font-mono text-[#172033] font-medium"
                title={gig.client}
              >
                {shortenAddress(gig.client, 6)}
                {role === "CLIENT" && (
                  <span className="ml-1.5 text-[10px] font-bold text-[#176B4A]">(you)</span>
                )}
              </span>
            </div>

            <div className="p-3 bg-[#F8F8FC] border border-[#E2E4EE] rounded-lg">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A93A3] block mb-1">
                Freelancer Address
              </span>
              <span
                className="font-mono text-[#172033] font-medium"
                title={gig.freelancer}
              >
                {shortenAddress(gig.freelancer, 6)}
                {role === "FREELANCER" && (
                  <span className="ml-1.5 text-[10px] font-bold text-[#4F46E5]">(you)</span>
                )}
              </span>
            </div>

            <div className="p-3 bg-[#F8F8FC] border border-[#E2E4EE] rounded-lg">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A93A3] block mb-1">
                Filed On
              </span>
              <span className="text-[#172033] font-medium">
                {dispute?.createdAt ? new Date(dispute.createdAt).toLocaleString() : "On-chain record"}
              </span>
            </div>
          </div>

          {dispute?.reason && (
            <div className="p-4 rounded-xl bg-red-50/50 border border-red-200/60">
              <p className="text-[11px] font-bold uppercase tracking-wider text-red-800 mb-1">Claim Summary</p>
              <p className="text-xs text-red-950 leading-relaxed">{dispute.reason}</p>
            </div>
          )}
        </div>

        {/* Stage 2: Evidence Thread */}
        <div className="bg-white border border-[#E2E4EE] rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2E4EE]">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#E8F5EE] text-[#176B4A] text-xs font-bold flex items-center justify-center">
                2
              </span>
              <h2 className="text-sm font-bold text-[#172033]">Evidence & Context Timeline</h2>
            </div>
            <span className="text-xs text-[#5F6878] font-medium">
              {dispute?.evidence?.length || 0} Submissions
            </span>
          </div>

          {!dispute?.evidence?.length ? (
            <div className="text-center py-8 text-xs text-[#8A93A3] bg-[#F8F8FC] rounded-lg border border-[#E2E4EE]">
              No evidence submitted to this dispute yet.
            </div>
          ) : (
            <div className="space-y-3">
              {dispute.evidence.map((e) => (
                <div key={e.id} className="p-4 rounded-xl bg-[#F8F8FC] border border-[#E2E4EE] space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-[#8A93A3]">
                    <span className="font-mono font-medium text-[#172033]">
                      Submitted by: {shortenAddress(e.submittedBy, 4)}
                    </span>
                    <span>{new Date(e.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-[#172033] leading-relaxed">{e.content}</p>
                  {e.ipfsHash && (
                    <a
                      href={`https://gateway.pinata.cloud/ipfs/${e.ipfsHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#176B4A] hover:underline inline-flex items-center gap-1 font-mono mt-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>IPFS Proof: {e.ipfsHash.slice(0, 16)}...</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Submit new evidence — parties only (client or freelancer) */}
          {isParty && (
            <div className="pt-3 border-t border-[#E2E4EE] space-y-2">
              <label
                className="block text-[11px] font-bold uppercase tracking-wider text-[#5F6878]"
                htmlFor="evidence-textarea"
              >
                Submit Additional Evidence or Clarification
              </label>
              <textarea
                value={evidenceText}
                onChange={(e) => setEvidenceText(e.target.value)}
                placeholder="Provide contract details, message screenshots, commit links, or timeline records..."
                rows={3}
                className="w-full bg-[#F8F8FC] border border-[#E2E4EE] rounded-lg p-3 text-xs text-[#172033] placeholder:text-[#8A93A3] focus:outline-none focus:border-[#176B4A] focus:bg-white transition-colors resize-none"
                id="evidence-textarea"
              />
              <button
                onClick={submitEvidence}
                disabled={submittingEvidence || !evidenceText.trim()}
                id="submit-evidence-btn"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-[#E2E4EE] text-xs font-semibold text-[#172033] hover:bg-[#F1F2FA] transition-colors disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5 text-[#5F6878]" />
                <span>{submittingEvidence ? "Submitting Evidence..." : "Add Evidence to Record"}</span>
              </button>
            </div>
          )}

          {/* Arbitrator can also see evidence submission area (read-only view) */}
          {isArbitrator && (
            <div className="pt-3 border-t border-[#E2E4EE]">
              <div className="flex items-center gap-2 text-xs text-[#8A93A3]">
                <FileText className="w-3.5 h-3.5" />
                <span>Evidence review mode — only the involved parties may submit additional evidence.</span>
              </div>
            </div>
          )}
        </div>

        {/* Stage 3: AI Advisory Assessment */}
        <div className="bg-white border border-[#E2E4EE] rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#E2E4EE]">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#EEEAFB] text-[#7567C7] text-xs font-bold flex items-center justify-center">
                3
              </span>
              <h2 className="text-sm font-bold text-[#172033]">AI Advisory Analysis (GPT-4o)</h2>
            </div>
            {/* AI analysis trigger — available to all authorized parties */}
            {!dispute?.aiRecommendation && (
              <button
                onClick={triggerAIAnalysis}
                disabled={analyzingAI}
                id="trigger-ai-analysis-btn"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#EEEAFB] text-[#7567C7] border border-[#7567C7]/30 text-xs font-semibold hover:bg-[#EEEAFB]/80 transition-colors disabled:opacity-50"
              >
                {analyzingAI ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Brain className="w-3.5 h-3.5" />}
                <span>{analyzingAI ? "Analyzing Dossier..." : "Run AI Analysis"}</span>
              </button>
            )}
          </div>

          {dispute?.aiRecommendation ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs text-[#5F6878]">Recommendation:</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold ${
                    dispute.aiRecommendation.recommendation === "release_to_freelancer"
                      ? "bg-[#E8F5EE] text-[#176B4A] border border-[#23895A]/30"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {dispute.aiRecommendation.recommendation === "release_to_freelancer"
                    ? "Release Funds to Freelancer"
                    : "Refund Escrow to Client"}
                </span>
                <span className="text-xs font-semibold text-[#5F6878]">
                  Confidence: {(dispute.aiRecommendation.confidence * 100).toFixed(0)}%
                </span>
              </div>

              <div className="p-4 rounded-xl bg-[#F8F8FC] border border-[#E2E4EE] space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A93A3] block">
                  AI Contextual Reasoning
                </span>
                <p className="text-xs text-[#172033] leading-relaxed">{dispute.aiRecommendation.reasoning}</p>
              </div>

              <div className="p-4 rounded-xl bg-[#EEEAFB]/40 border border-[#7567C7]/20 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7567C7] block">
                  Suggested Resolution
                </span>
                <p className="text-xs text-[#172033] leading-relaxed">
                  {dispute.aiRecommendation.suggested_resolution}
                </p>
              </div>

              <p className="text-[11px] text-[#8A93A3] italic">
                Notice: AI analysis is purely advisory and non-binding. The authorized arbitrator makes the final on-chain resolution.
              </p>
            </div>
          ) : (
            <p className="text-xs text-[#5F6878] py-2">
              No AI evaluation recorded yet. Parties or arbitrator may run analysis on submitted evidence.
            </p>
          )}
        </div>

        {/* Stage 4: Arbitration Execution Panel */}
        <div className="bg-white border border-[#E2E4EE] rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-[#E2E4EE]">
            <span className="w-5 h-5 rounded-full bg-[#E8F5EE] text-[#176B4A] text-xs font-bold flex items-center justify-center">
              4
            </span>
            <h2 className="text-sm font-bold text-[#172033]">Arbitration Execution Panel</h2>
          </div>

          {/* ── ARBITRATOR: Show resolution controls ── */}
          {isArbitrator ? (
            <>
              <p className="text-xs text-[#5F6878]">
                Executing resolution triggers an on-chain smart contract transaction that unlocks escrow funds
                directly to the selected party.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => handleResolve(true)}
                  disabled={resolving}
                  id="resolve-freelancer-btn"
                  className="flex-1 py-3 px-4 rounded-xl bg-[#176B4A] hover:bg-[#13583C] text-white text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {resolving && resolveToFreelancer === true ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  <span>Resolve & Release to Freelancer</span>
                </button>

                <button
                  onClick={() => handleResolve(false)}
                  disabled={resolving}
                  id="resolve-client-btn"
                  className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {resolving && resolveToFreelancer === false ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  <span>Resolve & Refund to Client</span>
                </button>
              </div>
            </>
          ) : (
            /* ── CLIENT / FREELANCER: Awaiting arbitrator — no resolution controls ── */
            <div className="flex flex-col items-center gap-3 py-6 px-4 rounded-xl bg-[#F8F8FC] border border-[#E2E4EE]">
              <div className="w-10 h-10 rounded-full bg-[#FEF3C7] border border-[#F59E0B]/30 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-700" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-bold text-[#172033]">Awaiting arbitrator decision</p>
                <p className="text-xs text-[#5F6878] max-w-sm leading-relaxed">
                  The GigChain protocol arbitrator will review the evidence and issue an on-chain
                  resolution. Only the authorized arbitrator can execute fund release.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
