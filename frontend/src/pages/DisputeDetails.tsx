import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AlertTriangle, Loader2, ExternalLink, Shield, Brain, CheckCircle, XCircle, FileText } from "lucide-react";
import { useWallet } from "../context/WalletContext";
import { useGig } from "../hooks/useGig";
import { useGigEscrowContract } from "../hooks/useContract";
import { useToast } from "../components/TransactionToast";
import api from "../lib/api";
import { GigState, shortenAddress } from "../lib/types";

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

export default function DisputeDetails() {
  const { gigId } = useParams<{ gigId: string }>();
  const { address } = useWallet();
  const { gig, loading: gigLoading } = useGig(gigId ? parseInt(gigId) : null);
  const contract = useGigEscrowContract();
  const { txPending, txSuccess, txError } = useToast();
  const [dispute, setDispute] = useState<DisputeData | null>(null);
  const [loadingDispute, setLoadingDispute] = useState(true);
  const [evidenceText, setEvidenceText] = useState("");
  const [submittingEvidence, setSubmittingEvidence] = useState(false);
  const [analyzingAI, setAnalyzingAI] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolveToFreelancer, setResolveToFreelancer] = useState<boolean | null>(null);

  const isArbitrator = gig && address ? address.toLowerCase() !== gig.client.toLowerCase() && address.toLowerCase() !== gig.freelancer.toLowerCase() : false;
  const isParty = gig && address ? address.toLowerCase() === gig.client.toLowerCase() || address.toLowerCase() === gig.freelancer.toLowerCase() : false;

  useEffect(() => {
    if (!gigId) return;
    api.get(`/disputes/${gigId}`)
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
      setDispute((d) => d ? { ...d, aiRecommendation: r.data } : d);
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

  if (gigLoading || loadingDispute) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
      </div>
    );
  }

  if (!gig) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 text-red-400">Gig not found.</div>
      </div>
    );
  }

  if (gig.state !== GigState.Disputed) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 text-yellow-400">This gig has no active dispute.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4 page-enter">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center border border-red-500/30">
            <AlertTriangle className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h1 className="heading-lg">Dispute — Gig #{gigId}</h1>
            <p className="text-slate-400 text-sm">Active dispute requiring arbitration</p>
          </div>
        </div>

        {/* Dispute overview */}
        <div className="glass-card p-6 mb-5 border-red-500/20">
          <h2 className="heading-md mb-4 text-red-300">Dispute Details</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Raised by</span>
              <span className="font-mono text-slate-300">{dispute?.raisedBy ? shortenAddress(dispute.raisedBy) : "Unknown"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Filed at</span>
              <span className="text-slate-300">{dispute?.createdAt ? new Date(dispute.createdAt).toLocaleString() : "—"}</span>
            </div>
          </div>
          {dispute?.reason && (
            <div className="mt-4 p-4 rounded-xl bg-space-800">
              <p className="text-xs text-slate-500 mb-1">Dispute Reason</p>
              <p className="text-slate-300 text-sm">{dispute.reason}</p>
            </div>
          )}
        </div>

        {/* Evidence thread */}
        <div className="glass-card p-6 mb-5">
          <h2 className="heading-md mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-brand-400" /> Evidence Thread
          </h2>
          {!dispute?.evidence?.length ? (
            <p className="text-slate-500 text-sm">No evidence submitted yet.</p>
          ) : (
            <div className="space-y-3">
              {dispute.evidence.map((e) => (
                <div key={e.id} className="p-4 rounded-xl bg-space-700">
                  <div className="flex justify-between text-xs text-slate-500 mb-2">
                    <span className="font-mono">{shortenAddress(e.submittedBy)}</span>
                    <span>{new Date(e.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-slate-300">{e.content}</p>
                  {e.ipfsHash && (
                    <a
                      href={`https://gateway.pinata.cloud/ipfs/${e.ipfsHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-brand-400 flex items-center gap-1 mt-2 hover:text-brand-300"
                    >
                      <ExternalLink className="w-3 h-3" /> View on IPFS
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Submit evidence */}
          {isParty && (
            <div className="mt-4 pt-4 border-t border-space-600">
              <textarea
                value={evidenceText}
                onChange={(e) => setEvidenceText(e.target.value)}
                placeholder="Submit additional evidence or context..."
                rows={3}
                className="input-field resize-none text-sm mb-3"
                id="evidence-textarea"
              />
              <button
                onClick={submitEvidence}
                disabled={submittingEvidence}
                id="submit-evidence-btn"
                className="btn-secondary text-sm py-2"
              >
                {submittingEvidence ? "Submitting..." : "Submit Evidence"}
              </button>
            </div>
          )}
        </div>

        {/* AI Analysis */}
        <div className="glass-card p-6 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="heading-md flex items-center gap-2">
              <Brain className="w-4 h-4 text-cyan-400" /> AI Analysis (GPT-4o)
            </h2>
            {!dispute?.aiRecommendation && (
              <button
                onClick={triggerAIAnalysis}
                disabled={analyzingAI}
                id="trigger-ai-analysis-btn"
                className="btn-secondary text-xs py-1.5 px-4"
              >
                {analyzingAI ? <Loader2 className="w-3 h-3 animate-spin" /> : <Brain className="w-3 h-3" />}
                {analyzingAI ? "Analyzing..." : "Run AI Analysis"}
              </button>
            )}
          </div>

          {dispute?.aiRecommendation ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-slate-500 text-sm">Recommendation:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  dispute.aiRecommendation.recommendation === "release_to_freelancer"
                    ? "bg-green-500/20 text-green-300"
                    : "bg-red-500/20 text-red-300"
                }`}>
                  {dispute.aiRecommendation.recommendation === "release_to_freelancer"
                    ? "Release to Freelancer"
                    : "Refund to Client"}
                </span>
                <span className="text-slate-500 text-xs">
                  {(dispute.aiRecommendation.confidence * 100).toFixed(0)}% confidence
                </span>
              </div>
              <div className="p-4 rounded-xl bg-space-800">
                <p className="text-xs text-slate-500 mb-1">AI Reasoning</p>
                <p className="text-sm text-slate-300">{dispute.aiRecommendation.reasoning}</p>
              </div>
              <div className="p-4 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
                <p className="text-xs text-cyan-500 mb-1">Suggested Resolution</p>
                <p className="text-sm text-slate-300">{dispute.aiRecommendation.suggested_resolution}</p>
              </div>
              <p className="text-xs text-slate-600">AI analysis is advisory only. Human arbitrator makes the final call.</p>
            </div>
          ) : (
            <p className="text-slate-500 text-sm">No AI analysis yet. Click "Run AI Analysis" to get a recommendation.</p>
          )}
        </div>

        {/* Arbitrator Resolution Panel */}
        <div className="glass-card p-6 border-brand-600/30">
          <h2 className="heading-md mb-2 flex items-center gap-2">
            <Shield className="w-4 h-4 text-brand-400" /> Arbitrator Panel
          </h2>
          <p className="text-slate-500 text-xs mb-5">
            Only the arbitrator wallet can execute the resolution. This is an on-chain transaction.
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => handleResolve(true)}
              disabled={resolving}
              id="resolve-freelancer-btn"
              className="btn-success flex-1"
            >
              {resolving && resolveToFreelancer === true ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              Release to Freelancer
            </button>
            <button
              onClick={() => handleResolve(false)}
              disabled={resolving}
              id="resolve-client-btn"
              className="btn-danger flex-1"
            >
              {resolving && resolveToFreelancer === false ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              Refund Client
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
