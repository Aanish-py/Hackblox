import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { Plus, Trash2, Upload, Loader2, Info } from "lucide-react";
import { useWallet } from "../context/WalletContext";
import { useGigEscrowContract } from "../hooks/useContract";
import { useToast } from "../components/TransactionToast";
import api from "../lib/api";
import { ETH_ADDRESS } from "../lib/types";
import { GIGESCROW_ADDRESS } from "../lib/contracts";

interface MilestoneInput {
  description: string;
  value: string; // ETH as string
}

export default function PostGig() {
  const { isConnected, address } = useWallet();
  const contract = useGigEscrowContract();
  const { txPending, txSuccess, txError } = useToast();
  const navigate = useNavigate();

  const [description, setDescription] = useState("");
  const [tokenAddress, setTokenAddress] = useState(ETH_ADDRESS);
  const [milestones, setMilestones] = useState<MilestoneInput[]>([
    { description: "", value: "" },
    { description: "", value: "" },
  ]);
  const [uploadingIPFS, setUploadingIPFS] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEth = tokenAddress === ETH_ADDRESS || tokenAddress === "";

  const totalBudget = milestones.reduce((sum, m) => {
    const v = parseFloat(m.value);
    return sum + (isNaN(v) ? 0 : v);
  }, 0);

  const addMilestone = () => {
    if (milestones.length >= 10) return;
    setMilestones((prev) => [...prev, { description: "", value: "" }]);
  };

  const removeMilestone = (index: number) => {
    if (milestones.length <= 1) return;
    setMilestones((prev) => prev.filter((_, i) => i !== index));
  };

  const updateMilestone = (index: number, field: keyof MilestoneInput, value: string) => {
    setMilestones((prev) => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract || !address) { setError("Wallet not connected or contracts not deployed."); return; }
    if (!GIGESCROW_ADDRESS) { setError("Contracts not deployed yet. Run deploy script first."); return; }

    setError(null);
    setSubmitting(true);

    let ipfsDescription = description;

    try {
      // ── Step 1: Pin description to IPFS via backend ──────────────────
      setUploadingIPFS(true);
      try {
        const pinRes = await api.post("/gigs/pin-description", { description, client: address });
        ipfsDescription = pinRes.data.cid || description;
      } catch {
        // IPFS unavailable — store description directly (gas expensive but functional)
        console.warn("IPFS pin failed, storing description on-chain directly");
      } finally {
        setUploadingIPFS(false);
      }

      // ── Step 2: Prepare milestone data ───────────────────────────────
      const milestoneDescs = milestones.map((m) => m.description.trim());
      const milestoneValues = milestones.map((m) => ethers.parseEther(m.value || "0"));

      if (milestoneDescs.some((d) => !d)) { setError("All milestone descriptions are required."); return; }
      if (milestoneValues.some((v) => v === 0n)) { setError("All milestone values must be greater than 0."); return; }

      const totalWei = milestoneValues.reduce((a, b) => a + b, 0n);
      const token = isEth ? ETH_ADDRESS : tokenAddress;

      // ── Step 3: Send transaction ─────────────────────────────────────
      const toastId = txPending("Posting gig...", "Confirm the transaction in MetaMask.");
      let tx;

      if (isEth) {
        tx = await contract.postGig(token, ipfsDescription, milestoneDescs, milestoneValues, {
          value: totalWei,
        });
      } else {
        // ERC-20: must have approved first — warn user
        tx = await contract.postGig(token, ipfsDescription, milestoneDescs, milestoneValues);
      }

      await tx.wait();
      txSuccess(toastId, tx.hash);

      // ── Step 4: Index in backend ─────────────────────────────────────
      try {
        const gigCount = await contract.gigCount();
        await api.post("/gigs", {
          contractGigId: Number(gigCount),
          client: address,
          description: ipfsDescription,
          totalBudget: ethers.formatEther(totalWei),
          token,
          milestones: milestones.map((m, i) => ({
            description: m.description,
            value: m.value,
            index: i,
          })),
        });
      } catch {
        console.warn("Backend indexing failed — gig still live on-chain");
      }

      navigate("/my-contracts");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Transaction failed";
      setError(msg.includes("rejected") ? "Transaction rejected." : msg.slice(0, 200));
      if (submitting) txError("latest", msg.slice(0, 100));
    } finally {
      setSubmitting(false);
      setUploadingIPFS(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass-card p-10 text-center max-w-sm">
          <p className="text-slate-400 mb-4">Connect your wallet to post a gig.</p>
          <p className="text-sm text-slate-500">You need to be signed in as a client.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 page-enter">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="heading-lg mb-2">Post a New Gig</h1>
          <p className="text-slate-400">Funds are locked in the smart contract on submission. Released only on your approval.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Description */}
          <div className="glass-card p-6">
            <h2 className="heading-md mb-4">Project Description</h2>
            <label className="input-label" htmlFor="gig-description">
              Description <span className="text-slate-500 font-normal">(will be pinned to IPFS)</span>
            </label>
            <textarea
              id="gig-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the project, deliverables, timeline, and expectations..."
              rows={5}
              required
              className="input-field resize-none"
            />
            {uploadingIPFS && (
              <p className="text-xs text-brand-400 flex items-center gap-1 mt-2">
                <Loader2 className="w-3 h-3 animate-spin" /> Pinning to IPFS via Pinata...
              </p>
            )}
          </div>

          {/* Payment Token */}
          <div className="glass-card p-6">
            <h2 className="heading-md mb-4">Payment Token</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="token"
                  checked={isEth}
                  onChange={() => setTokenAddress(ETH_ADDRESS)}
                  className="accent-brand-500"
                  id="token-eth"
                />
                <div>
                  <p className="text-white font-medium">ETH (Ether)</p>
                  <p className="text-slate-500 text-xs">Native Ethereum — no token approval needed</p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="radio"
                  name="token"
                  checked={!isEth}
                  onChange={() => setTokenAddress("")}
                  className="accent-brand-500"
                  id="token-erc20"
                />
                <div>
                  <p className="text-white font-medium">ERC-20 Token</p>
                  <p className="text-slate-500 text-xs">USDC, USDT, or any ERC-20 — you must approve first</p>
                </div>
              </label>
              {!isEth && (
                <input
                  type="text"
                  value={tokenAddress}
                  onChange={(e) => setTokenAddress(e.target.value)}
                  placeholder="0x... ERC-20 token contract address"
                  className="input-field mt-2 font-mono text-sm"
                  id="token-address-input"
                />
              )}
            </div>
          </div>

          {/* Milestones */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="heading-md">Milestones</h2>
              <span className="text-slate-500 text-sm">{milestones.length}/10</span>
            </div>

            <div className="space-y-4">
              {milestones.map((m, i) => (
                <div key={i} className="glass-card p-4" style={{ background: "rgba(13,17,23,0.5)" }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-brand-300">Milestone {i + 1}</span>
                    {milestones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMilestone(i)}
                        className="text-slate-500 hover:text-red-400 transition-colors"
                        aria-label={`Remove milestone ${i + 1}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={m.description}
                      onChange={(e) => updateMilestone(i, "description", e.target.value)}
                      placeholder="What should be delivered for this milestone?"
                      className="input-field text-sm"
                      id={`milestone-desc-${i}`}
                      required
                    />
                    <div className="relative">
                      <input
                        type="number"
                        value={m.value}
                        onChange={(e) => updateMilestone(i, "value", e.target.value)}
                        placeholder="0.0"
                        step="0.001"
                        min="0.001"
                        className="input-field text-sm pr-16"
                        id={`milestone-value-${i}`}
                        required
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-mono">
                        {isEth ? "ETH" : "tokens"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addMilestone}
              disabled={milestones.length >= 10}
              id="add-milestone-btn"
              className="btn-secondary w-full mt-4 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Milestone {milestones.length >= 10 && "(max 10)"}
            </button>
          </div>

          {/* Summary */}
          <div className="glass-card p-6" style={{ background: "rgba(124,58,237,0.08)" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400">Total Budget</span>
              <span className="font-display font-bold text-2xl gradient-text">
                {totalBudget.toFixed(4)} {isEth ? "ETH" : "tokens"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Info className="w-3 h-3" />
              This exact amount will be locked in the smart contract immediately.
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          {!GIGESCROW_ADDRESS && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 text-yellow-400 text-sm flex items-start gap-2">
              <Info className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Contracts not deployed yet. Run <code className="font-mono bg-yellow-500/10 px-1 rounded">npm run deploy:local</code> in the contracts/ folder first.</span>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !GIGESCROW_ADDRESS}
            id="post-gig-submit-btn"
            className="btn-primary w-full text-base py-4"
          >
            {submitting ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> {uploadingIPFS ? "Uploading to IPFS..." : "Submitting transaction..."}</>
            ) : (
              <><Upload className="w-5 h-5" /> Post Gig & Lock Funds</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
