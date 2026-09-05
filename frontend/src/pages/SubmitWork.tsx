import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Upload, Link2, FileText, Loader2, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { useWallet } from "../context/WalletContext";
import { useGig } from "../hooks/useGig";
import DashboardShell from "../components/DashboardShell";
import api from "../lib/api";
import { GigState } from "../lib/types";

export default function SubmitWork() {
  const { gigId } = useParams<{ gigId: string }>();
  const navigate = useNavigate();
  const { address, isConnected } = useWallet();
  const { gig, loading } = useGig(gigId ? parseInt(gigId) : null);
  const [milestoneIndex, setMilestoneIndex] = useState(0);
  const [description, setDescription] = useState("");
  const [externalLink, setExternalLink] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ipfsHash, setIpfsHash] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address || !gigId) return;
    setSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("gigId", gigId);
      formData.append("milestoneIndex", String(milestoneIndex));
      formData.append("description", description);
      formData.append("externalLink", externalLink);
      if (file) formData.append("file", file);

      const res = await api.post("/submissions", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setIpfsHash(res.data.ipfsHash || null);
      setDone(true);
    } catch (err: unknown) {
      const apiErr = err as { response?: { data?: { error?: string } }; message?: string };
      setError(apiErr?.response?.data?.error || apiErr?.message || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isConnected) {
    return (
      <DashboardShell>
        <div className="bg-white border border-[#E2E4EE] rounded-xl p-12 text-center max-w-md mx-auto my-12 shadow-xs">
          <p className="text-[#5F6878] text-sm mb-4">Connect your wallet to submit milestone work.</p>
          <button
            onClick={() => navigate("/auth")}
            className="py-2.5 px-4 rounded-lg bg-[#176B4A] hover:bg-[#13583C] text-white text-xs font-semibold transition-colors"
          >
            Connect Wallet
          </button>
        </div>
      </DashboardShell>
    );
  }

  if (loading) {
    return (
      <DashboardShell>
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-8 h-8 text-[#176B4A] animate-spin" />
          <p className="text-xs text-[#5F6878]">Loading gig details from smart contract...</p>
        </div>
      </DashboardShell>
    );
  }

  if (!gig) {
    return (
      <DashboardShell>
        <div className="bg-white border border-[#E2E4EE] rounded-xl p-10 text-center max-w-md mx-auto my-12 shadow-xs">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-base font-bold text-[#172033] mb-1">Gig #{gigId} Not Found</p>
          <p className="text-xs text-[#5F6878] mb-4">The requested escrow contract could not be retrieved from on-chain state.</p>
          <button
            onClick={() => navigate("/my-contracts")}
            className="px-4 py-2 rounded-lg bg-white border border-[#E2E4EE] text-xs font-semibold text-[#172033] hover:bg-[#F1F2FA]"
          >
            Back to Overview
          </button>
        </div>
      </DashboardShell>
    );
  }

  if (!address || gig.freelancer.toLowerCase() !== address.toLowerCase()) {
    return (
      <DashboardShell>
        <div className="bg-white border border-[#E2E4EE] rounded-xl p-10 text-center max-w-md mx-auto my-12 shadow-xs">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <p className="text-base font-bold text-[#172033] mb-1">Unauthorized Submitter</p>
          <p className="text-xs text-[#5F6878] mb-4">
            Only the assigned freelancer ({gig.freelancer.slice(0, 6)}...{gig.freelancer.slice(-4)}) can submit milestone deliverables.
          </p>
          <button
            onClick={() => navigate("/my-contracts")}
            className="px-4 py-2 rounded-lg bg-[#176B4A] text-white text-xs font-semibold"
          >
            Back to Dashboard
          </button>
        </div>
      </DashboardShell>
    );
  }

  if (gig.state !== GigState.InProgress) {
    return (
      <DashboardShell>
        <div className="bg-white border border-[#E2E4EE] rounded-xl p-10 text-center max-w-md mx-auto my-12 shadow-xs">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <p className="text-base font-bold text-[#172033] mb-1">Gig is Not In Progress</p>
          <p className="text-xs text-[#5F6878] mb-4">Work can only be submitted while the escrow contract is actively In Progress.</p>
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

  const pendingMilestones = gig.milestones
    .map((m, i) => ({ ...m, index: i }))
    .filter((m) => !m.completed);

  if (done) {
    return (
      <DashboardShell>
        <div className="bg-white border border-[#E2E4EE] rounded-xl p-10 text-center max-w-lg mx-auto my-12 shadow-sm space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#E8F5EE] flex items-center justify-center mx-auto text-[#176B4A]">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-[#172033]">Deliverable Submitted Successfully!</h2>
          <p className="text-xs text-[#5F6878] leading-relaxed max-w-sm mx-auto">
            Your milestone submission has been recorded on-chain and indexed. The client will be notified to review and release payment.
          </p>
          {ipfsHash && (
            <div className="p-3.5 bg-[#F8F8FC] border border-[#E2E4EE] rounded-lg text-left">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A93A3] block mb-1">
                IPFS Content Hash
              </span>
              <span className="font-mono text-xs text-[#176B4A] break-all select-all font-medium">
                {ipfsHash}
              </span>
            </div>
          )}
          <button
            onClick={() => navigate("/my-contracts")}
            className="w-full py-2.5 px-4 rounded-lg bg-[#176B4A] hover:bg-[#13583C] text-white text-xs font-semibold transition-colors shadow-xs"
            id="back-to-contracts-btn"
          >
            Return to Dashboard Overview
          </button>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Back navigation & Header */}
        <div className="pb-3 border-b border-[#E2E4EE]">
          <button
            onClick={() => navigate("/my-contracts")}
            className="inline-flex items-center gap-1.5 text-xs text-[#5F6878] hover:text-[#172033] mb-3 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-2xl font-bold text-[#172033] tracking-tight">Submit Deliverable</h1>
          <p className="text-xs text-[#5F6878] mt-0.5">
            Gig #{gigId} · Upload deliverable proof and notify client for milestone approval.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Milestone selector */}
          <div className="bg-white border border-[#E2E4EE] rounded-xl p-5 shadow-xs space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#5F6878]" htmlFor="milestone-select">
              Select Milestone
            </label>
            <select
              id="milestone-select"
              value={milestoneIndex}
              onChange={(e) => setMilestoneIndex(parseInt(e.target.value))}
              className="w-full bg-[#F8F8FC] border border-[#E2E4EE] rounded-lg px-3.5 py-2.5 text-xs font-medium text-[#172033] focus:outline-none focus:border-[#176B4A] focus:bg-white transition-colors"
            >
              {pendingMilestones.map((m) => (
                <option key={m.index} value={m.index}>
                  Milestone {m.index + 1}: {m.description.slice(0, 60)}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="bg-white border border-[#E2E4EE] rounded-xl p-5 shadow-xs space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#5F6878] flex items-center gap-1.5" htmlFor="submission-desc">
              <FileText className="w-3.5 h-3.5 text-[#176B4A]" />
              <span>Deliverable Summary</span>
            </label>
            <textarea
              id="submission-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe in detail what you delivered, how it meets the milestone acceptance criteria, and any notes for the client..."
              rows={5}
              required
              className="w-full bg-[#F8F8FC] border border-[#E2E4EE] rounded-lg p-3 text-xs text-[#172033] placeholder:text-[#8A93A3] focus:outline-none focus:border-[#176B4A] focus:bg-white transition-colors resize-none"
            />
          </div>

          {/* External link */}
          <div className="bg-white border border-[#E2E4EE] rounded-xl p-5 shadow-xs space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#5F6878] flex items-center gap-1.5" htmlFor="external-link">
              <Link2 className="w-3.5 h-3.5 text-[#176B4A]" />
              <span>External Repository or Deliverable Link (Optional)</span>
            </label>
            <input
              id="external-link"
              type="url"
              value={externalLink}
              onChange={(e) => setExternalLink(e.target.value)}
              placeholder="https://github.com/org/repo/pull/1 or Figma URL"
              className="w-full bg-[#F8F8FC] border border-[#E2E4EE] rounded-lg px-3.5 py-2.5 text-xs font-mono text-[#172033] placeholder:text-[#8A93A3] focus:outline-none focus:border-[#176B4A] focus:bg-white transition-colors"
            />
          </div>

          {/* File upload */}
          <div className="bg-white border border-[#E2E4EE] rounded-xl p-5 shadow-xs space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#5F6878] flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-[#176B4A]" />
              <span>Upload Deliverable Artifact (Pinned to IPFS)</span>
            </label>
            <label
              className="flex flex-col items-center justify-center gap-2 p-8 rounded-xl border border-dashed border-[#E2E4EE] hover:border-[#176B4A]/50 bg-[#F8F8FC] hover:bg-[#E8F5EE]/30 transition-colors cursor-pointer"
              htmlFor="file-upload"
            >
              <Upload className="w-7 h-7 text-[#176B4A]" />
              <span className="text-xs font-medium text-[#172033]">
                {file ? file.name : "Click to select file or drag and drop"}
              </span>
              <span className="text-[11px] text-[#8A93A3]">Max 10MB · ZIP, PDF, images, TXT</span>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.png,.jpg,.jpeg,.zip,.txt,.md"
              />
            </label>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            id="submit-work-btn"
            className="w-full py-3.5 px-4 rounded-xl bg-[#176B4A] hover:bg-[#13583C] text-white text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Uploading to IPFS & Submitting Deliverable...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Submit Deliverable for Client Approval</span>
              </>
            )}
          </button>
        </form>
      </div>
    </DashboardShell>
  );
}

