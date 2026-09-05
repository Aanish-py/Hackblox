import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Upload, Link2, FileText, Loader2, CheckCircle } from "lucide-react";
import { useWallet } from "../context/WalletContext";
import { useGig } from "../hooks/useGig";
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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 text-center"><p className="text-slate-400">Connect wallet to submit work.</p></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
      </div>
    );
  }

  if (!gig) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 text-center text-red-400">Gig #{gigId} not found.</div>
      </div>
    );
  }

  if (!address || gig.freelancer.toLowerCase() !== address.toLowerCase()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 text-center text-red-400">Only the assigned freelancer can submit work.</div>
      </div>
    );
  }

  if (gig.state !== GigState.InProgress) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-8 text-center text-yellow-400">This gig is not in progress.</div>
      </div>
    );
  }

  const pendingMilestones = gig.milestones
    .map((m, i) => ({ ...m, index: i }))
    .filter((m) => !m.completed);

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center page-enter">
        <div className="glass-card p-10 text-center max-w-md">
          <CheckCircle className="w-14 h-14 text-green-400 mx-auto mb-4" />
          <h2 className="heading-md mb-2">Submission Received!</h2>
          <p className="text-slate-400 text-sm mb-4">
            Your work has been submitted. The client will review and release payment.
          </p>
          {ipfsHash && (
            <div className="glass-card p-3 mb-4" style={{ background: "rgba(13,17,23,0.6)" }}>
              <p className="text-xs text-slate-500 mb-1">IPFS Hash</p>
              <p className="font-mono text-xs text-brand-300 break-all">{ipfsHash}</p>
            </div>
          )}
          <button onClick={() => navigate("/my-contracts")} className="btn-primary" id="back-to-contracts-btn">
            Back to My Contracts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 page-enter">
      <div className="max-w-xl mx-auto">
        <div className="mb-8">
          <h1 className="heading-lg mb-2">Submit Deliverable</h1>
          <p className="text-slate-400 text-sm">
            Gig #{gigId} · Notify the client you've completed a milestone.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Milestone selector */}
          <div className="glass-card p-5">
            <label className="input-label" htmlFor="milestone-select">Which milestone?</label>
            <select
              id="milestone-select"
              value={milestoneIndex}
              onChange={(e) => setMilestoneIndex(parseInt(e.target.value))}
              className="input-field"
            >
              {pendingMilestones.map((m) => (
                <option key={m.index} value={m.index}>
                  Milestone {m.index + 1}: {m.description.slice(0, 50)}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="glass-card p-5">
            <label className="input-label" htmlFor="submission-desc">
              <FileText className="w-3 h-3 inline mr-1" /> Work Description
            </label>
            <textarea
              id="submission-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you delivered, how it meets the milestone requirements, and any relevant details..."
              rows={5}
              required
              className="input-field resize-none"
            />
          </div>

          {/* External link */}
          <div className="glass-card p-5">
            <label className="input-label" htmlFor="external-link">
              <Link2 className="w-3 h-3 inline mr-1" /> Deliverable Link (optional)
            </label>
            <input
              id="external-link"
              type="url"
              value={externalLink}
              onChange={(e) => setExternalLink(e.target.value)}
              placeholder="https://github.com/... or https://drive.google.com/..."
              className="input-field"
            />
          </div>

          {/* File upload */}
          <div className="glass-card p-5">
            <label className="input-label">
              <Upload className="w-3 h-3 inline mr-1" /> Upload File (optional — pinned to IPFS via Pinata)
            </label>
            <label
              className="flex flex-col items-center justify-center gap-3 p-8 rounded-xl border border-dashed border-brand-600/30 hover:border-brand-600/60 transition-colors cursor-pointer"
              htmlFor="file-upload"
            >
              <Upload className="w-8 h-8 text-brand-400" />
              <span className="text-sm text-slate-400">
                {file ? file.name : "Click to upload or drag & drop"}
              </span>
              <span className="text-xs text-slate-600">Max 10MB · PDF, images, ZIP</span>
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
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">{error}</div>
          )}

          <button type="submit" disabled={submitting} id="submit-work-btn" className="btn-primary w-full py-4 text-base">
            {submitting ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Uploading & Submitting...</>
            ) : (
              <><Upload className="w-5 h-5" /> Submit Deliverable</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
