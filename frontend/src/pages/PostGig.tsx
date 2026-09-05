import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ethers } from "ethers";
import { Plus, Trash2, Upload, Loader2, Info, Shield, CheckCircle2, AlertCircle } from "lucide-react";
import { useWallet } from "../context/WalletContext";
import { useGigEscrowContract } from "../hooks/useContract";
import { useToast } from "../components/TransactionToast";
import DashboardShell from "../components/DashboardShell";
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
    setMilestones((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contract || !address) {
      setError("Wallet not connected or contracts not deployed.");
      return;
    }
    if (!GIGESCROW_ADDRESS) {
      setError("Contracts not deployed yet. Please deploy contracts first.");
      return;
    }

    setError(null);
    setSubmitting(true);

    let ipfsDescription = description;

    try {
      // Step 1: Pin description to IPFS via backend
      setUploadingIPFS(true);
      try {
        const pinRes = await api.post("/gigs/pin-description", { description, client: address });
        ipfsDescription = pinRes.data.cid || description;
      } catch {
        console.warn("IPFS pin failed, storing description directly");
      } finally {
        setUploadingIPFS(false);
      }

      // Step 2: Prepare milestone data
      const milestoneDescs = milestones.map((m) => m.description.trim());
      const milestoneValues = milestones.map((m) => ethers.parseEther(m.value || "0"));

      if (milestoneDescs.some((d) => !d)) {
        setError("All milestone descriptions are required.");
        return;
      }
      if (milestoneValues.some((v) => v === 0n)) {
        setError("All milestone values must be greater than 0.");
        return;
      }

      const totalWei = milestoneValues.reduce((a, b) => a + b, 0n);
      const token = isEth ? ETH_ADDRESS : tokenAddress;

      // Step 3: Send transaction
      const toastId = txPending("Posting gig...", "Confirm the escrow creation in MetaMask.");
      let tx;

      if (isEth) {
        tx = await contract.postGig(token, ipfsDescription, milestoneDescs, milestoneValues, {
          value: totalWei,
        });
      } else {
        tx = await contract.postGig(token, ipfsDescription, milestoneDescs, milestoneValues);
      }

      await tx.wait();
      txSuccess(toastId, tx.hash);

      // Step 4: Index in backend
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
        console.warn("Backend indexing skipped/failed — gig still created on-chain");
      }

      navigate("/my-contracts");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Transaction failed";
      setError(msg.includes("rejected") ? "Transaction rejected by user in MetaMask." : msg.slice(0, 200));
      if (submitting) txError("latest", msg.slice(0, 100));
    } finally {
      setSubmitting(false);
      setUploadingIPFS(false);
    }
  };

  if (!isConnected) {
    return (
      <DashboardShell>
        <div className="bg-white border border-[#E2E4EE] rounded-xl p-12 text-center max-w-md mx-auto my-12 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-[#E8F5EE] text-[#176B4A] flex items-center justify-center mx-auto mb-4">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-[#172033] mb-2">Connect Your Wallet</h2>
          <p className="text-[#5F6878] text-sm mb-6">
            You must connect a Web3 wallet to deploy escrow contracts and post gigs on-chain.
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="w-full py-2.5 px-4 rounded-lg bg-[#176B4A] hover:bg-[#13583C] text-white text-sm font-semibold transition-colors shadow-xs"
          >
            Go to Authentication
          </button>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="pb-4 border-b border-[#E2E4EE]">
          <h1 className="text-2xl font-bold text-[#172033] tracking-tight">Post a New Gig</h1>
          <p className="text-[#5F6878] text-sm mt-0.5">
            Configure project scope and lock escrow funds into the smart contract. Funds are released per approved milestone.
          </p>
        </div>

        {!GIGESCROW_ADDRESS && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-900 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="font-semibold">Contracts not deployed</p>
              <p className="text-xs text-amber-700 mt-0.5">Please deploy your smart contracts to Sepolia or local testnet before posting gigs.</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* 2-Column Stitch Layout: Left = Project & Milestones, Right = Escrow Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Form Fields (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Section 1: Project Scope */}
              <div className="bg-white border border-[#E2E4EE] rounded-xl p-6 shadow-xs">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-6 h-6 rounded-full bg-[#E8F5EE] text-[#176B4A] text-xs font-bold flex items-center justify-center">
                    1
                  </span>
                  <h2 className="text-base font-bold text-[#172033]">Project Scope</h2>
                </div>
                <label className="block text-xs font-semibold text-[#5F6878] uppercase tracking-wider mb-2" htmlFor="gig-description">
                  Scope & Deliverables <span className="text-[#8A93A3] normal-case font-normal">(stored on IPFS)</span>
                </label>
                <textarea
                  id="gig-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the exact requirements, deliverables, timeline, technical stack, and acceptance criteria..."
                  rows={5}
                  required
                  className="w-full bg-[#F8F8FC] border border-[#E2E4EE] rounded-lg p-3.5 text-sm text-[#172033] placeholder:text-[#8A93A3] focus:outline-none focus:border-[#176B4A] focus:bg-white transition-colors resize-none"
                />
                {uploadingIPFS && (
                  <p className="text-xs text-[#176B4A] flex items-center gap-1.5 mt-2 font-medium">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Pinning metadata to IPFS...
                  </p>
                )}
              </div>

              {/* Section 2: Payment Token */}
              <div className="bg-white border border-[#E2E4EE] rounded-xl p-6 shadow-xs">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-6 h-6 rounded-full bg-[#E8F5EE] text-[#176B4A] text-xs font-bold flex items-center justify-center">
                    2
                  </span>
                  <h2 className="text-base font-bold text-[#172033]">Payment Currency</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    htmlFor="token-eth"
                    className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                      isEth
                        ? "bg-[#E8F5EE] border-[#176B4A] shadow-xs"
                        : "bg-[#F8F8FC] border-[#E2E4EE] hover:bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="token"
                      id="token-eth"
                      checked={isEth}
                      onChange={() => setTokenAddress(ETH_ADDRESS)}
                      className="mt-1 accent-[#176B4A]"
                    />
                    <div>
                      <p className="text-sm font-bold text-[#172033]">Native ETH</p>
                      <p className="text-xs text-[#5F6878] mt-0.5">Direct Ethereum transfer with zero approval transaction</p>
                    </div>
                  </label>

                  <label
                    htmlFor="token-erc20"
                    className={`flex items-start gap-3 p-3.5 rounded-lg border cursor-pointer transition-all ${
                      !isEth
                        ? "bg-[#E8F5EE] border-[#176B4A] shadow-xs"
                        : "bg-[#F8F8FC] border-[#E2E4EE] hover:bg-white"
                    }`}
                  >
                    <input
                      type="radio"
                      name="token"
                      id="token-erc20"
                      checked={!isEth}
                      onChange={() => setTokenAddress("")}
                      className="mt-1 accent-[#176B4A]"
                    />
                    <div>
                      <p className="text-sm font-bold text-[#172033]">ERC-20 Token</p>
                      <p className="text-xs text-[#5F6878] mt-0.5">Stablecoins (USDC/USDT) or custom ERC-20 tokens</p>
                    </div>
                  </label>
                </div>

                {!isEth && (
                  <div className="mt-4">
                    <label className="block text-xs font-semibold text-[#5F6878] uppercase tracking-wider mb-1.5" htmlFor="token-address-input">
                      ERC-20 Contract Address
                    </label>
                    <input
                      type="text"
                      id="token-address-input"
                      value={tokenAddress}
                      onChange={(e) => setTokenAddress(e.target.value)}
                      placeholder="0x... ERC-20 contract address on Sepolia"
                      className="w-full bg-[#F8F8FC] border border-[#E2E4EE] rounded-lg px-3.5 py-2.5 font-mono text-xs text-[#172033] placeholder:text-[#8A93A3] focus:outline-none focus:border-[#176B4A] focus:bg-white transition-colors"
                      required={!isEth}
                    />
                  </div>
                )}
              </div>

              {/* Section 3: Milestones */}
              <div className="bg-white border border-[#E2E4EE] rounded-xl p-6 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#E8F5EE] text-[#176B4A] text-xs font-bold flex items-center justify-center">
                      3
                    </span>
                    <h2 className="text-base font-bold text-[#172033]">Milestones</h2>
                  </div>
                  <span className="text-xs font-semibold text-[#5F6878] bg-[#F1F2FA] px-2.5 py-1 rounded-full">
                    {milestones.length} of 10
                  </span>
                </div>

                <div className="space-y-3.5">
                  {milestones.map((m, i) => (
                    <div key={i} className="bg-[#F8F8FC] border border-[#E2E4EE] rounded-xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#176B4A]">
                          Milestone {i + 1}
                        </span>
                        {milestones.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeMilestone(i)}
                            className="text-[#8A93A3] hover:text-red-600 transition-colors p-1"
                            aria-label={`Remove milestone ${i + 1}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                        <div className="sm:col-span-8">
                          <input
                            type="text"
                            value={m.description}
                            onChange={(e) => updateMilestone(i, "description", e.target.value)}
                            placeholder={`e.g. Milestone ${i + 1} deliverables & acceptance criteria`}
                            className="w-full bg-white border border-[#E2E4EE] rounded-lg px-3 py-2 text-xs text-[#172033] placeholder:text-[#8A93A3] focus:outline-none focus:border-[#176B4A] transition-colors"
                            id={`milestone-desc-${i}`}
                            required
                          />
                        </div>
                        <div className="sm:col-span-4 relative">
                          <input
                            type="number"
                            value={m.value}
                            onChange={(e) => updateMilestone(i, "value", e.target.value)}
                            placeholder="0.0"
                            step="0.001"
                            min="0.0001"
                            className="w-full bg-white border border-[#E2E4EE] rounded-lg pl-3 pr-14 py-2 text-xs font-mono font-medium text-[#172033] placeholder:text-[#8A93A3] focus:outline-none focus:border-[#176B4A] transition-colors"
                            id={`milestone-value-${i}`}
                            required
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A93A3] text-xs font-mono">
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
                  className="w-full mt-4 py-2.5 px-4 rounded-lg bg-[#F8F8FC] border border-dashed border-[#E2E4EE] text-xs font-semibold text-[#176B4A] hover:bg-[#E8F5EE] hover:border-[#176B4A]/40 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Milestone {milestones.length >= 10 && "(max 10 reached)"}
                </button>
              </div>
            </div>

            {/* Right Column: Escrow Summary (5 cols, sticky) */}
            <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
              <div className="bg-white border border-[#E2E4EE] rounded-xl p-6 shadow-sm space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-[#E2E4EE]">
                  <Shield className="w-5 h-5 text-[#176B4A]" />
                  <h3 className="text-base font-bold text-[#172033]">Escrow Summary</h3>
                </div>

                {/* Total Budget KPI */}
                <div className="p-4 rounded-xl bg-[#E8F5EE] border border-[#23895A]/20">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#176B4A]">
                    Total Escrow Deposit
                  </span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-[#176B4A] font-mono tracking-tight">
                      {totalBudget.toFixed(4)}
                    </span>
                    <span className="text-sm font-bold text-[#176B4A]">
                      {isEth ? "ETH" : "tokens"}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#23895A] mt-1 font-medium">
                    100% of this amount will be locked in the smart contract immediately upon confirmation.
                  </p>
                </div>

                {/* Breakdown List */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between text-[#5F6878] py-1 border-b border-[#F1F2FA]">
                    <span>Total Milestones</span>
                    <span className="font-semibold text-[#172033]">{milestones.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#5F6878] py-1 border-b border-[#F1F2FA]">
                    <span>Currency</span>
                    <span className="font-semibold text-[#172033] font-mono">{isEth ? "ETH (Native)" : "ERC-20"}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#5F6878] py-1 border-b border-[#F1F2FA]">
                    <span>Contract Security</span>
                    <span className="font-semibold text-[#176B4A] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Reentrancy Guard
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[#5F6878] py-1">
                    <span>Dispute Protection</span>
                    <span className="font-semibold text-[#7567C7]">Arbitrator Ready</span>
                  </div>
                </div>

                {/* Security Trust Note */}
                <div className="p-3 bg-[#F8F8FC] border border-[#E2E4EE] rounded-lg text-xs text-[#5F6878] flex items-start gap-2">
                  <Info className="w-4 h-4 text-[#8A93A3] shrink-0 mt-0.5" />
                  <span>
                    Neither party can unilaterally withdraw locked escrow funds without milestone release or arbitration resolution.
                  </span>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting || !GIGESCROW_ADDRESS}
                  id="post-gig-submit-btn"
                  className="w-full py-3.5 px-4 rounded-xl bg-[#176B4A] hover:bg-[#13583C] text-white text-sm font-semibold transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{uploadingIPFS ? "Uploading to IPFS..." : "Submitting Escrow Transaction..."}</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Post Gig & Lock Escrow</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </DashboardShell>
  );
}

