import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, RefreshCw, AlertCircle, Briefcase, Info } from "lucide-react";
import { useAllGigs } from "../hooks/useGig";
import { useGigEscrowContract } from "../hooks/useContract";
import { useWallet } from "../context/WalletContext";
import { useToast } from "../components/TransactionToast";
import GigCard from "../components/GigCard";
import DashboardShell from "../components/DashboardShell";
import { GigState, type Gig, ETH_ADDRESS } from "../lib/types";
import { GIGESCROW_ADDRESS } from "../lib/contracts";
import clsx from "clsx";

type TokenFilter = "all" | "eth" | "erc20";

/**
 * BrowseContracts — Public Marketplace
 *
 * Displays ONLY open gigs (GigState.Open) that are genuinely available
 * for new freelancer bids. Non-open contracts (In Progress, Disputed,
 * Completed) are private workspace state and are NOT shown here.
 *
 * Participants access their active/non-open contracts via My Contracts.
 */
export default function BrowseContracts() {
  const { address, isConnected, isAuthenticated } = useWallet();
  const navigate = useNavigate();
  const contract = useGigEscrowContract();
  const { txPending, txSuccess, txError } = useToast();
  const { gigs, loading, error, refetch } = useAllGigs(50);
  const [tokenFilter, setTokenFilter] = useState<TokenFilter>("all");
  const [search, setSearch] = useState("");
  const [bidding, setBidding] = useState<number | null>(null);

  const handleBid = async (gig: Gig) => {
    if (!isAuthenticated) {
      navigate("/auth?returnTo=/browse");
      return;
    }
    if (!contract || !address) return;
    setBidding(Number(gig.gigId));
    const id = txPending(`Placing bid on Gig #${Number(gig.gigId)}`, "Confirm in MetaMask");
    try {
      const stakeAmount = await contract.stakeAmount();
      const stakeToken = await contract.stakeToken();
      const tx = await contract.bidGig(gig.gigId, {
        value: stakeToken === ETH_ADDRESS ? stakeAmount : 0n,
      });
      await tx.wait();
      txSuccess(id, tx.hash);
      refetch();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Bid failed";
      txError(id, msg.includes("rejected") ? "Bid rejected." : msg.slice(0, 100));
    } finally {
      setBidding(null);
    }
  };

  // ── Public Marketplace Filter ─────────────────────────────────────────────
  // Only OPEN gigs are shown in the public marketplace. Non-open contracts
  // (In Progress, Disputed, Completed) belong to the private participant
  // workspace (My Contracts) and are NOT exposed in Browse.
  const openGigs = gigs.filter((g) => g.state === GigState.Open);

  const filtered = openGigs.filter((g) => {
    if (tokenFilter === "eth" && g.token !== ETH_ADDRESS) return false;
    if (tokenFilter === "erc20" && g.token === ETH_ADDRESS) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !g.description.toLowerCase().includes(q) &&
        !g.client.toLowerCase().includes(q) &&
        !String(Number(g.gigId)).includes(q)
      )
        return false;
    }
    return true;
  });

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E2E4EE]">
        <div>
          <h1 className="text-2xl font-bold text-[#172033] tracking-tight">Open Gig Marketplace</h1>
          <p className="text-[#5F6878] text-sm mt-0.5">
            Discover available on-chain escrow opportunities ·{" "}
            <span className="font-semibold text-[#172033]">{openGigs.length}</span> open ·{" "}
            <span className="font-semibold text-[#172033]">{filtered.length}</span> matching filter
          </p>
        </div>
        <button
          onClick={refetch}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-[#E2E4EE] text-xs font-semibold text-[#172033] hover:bg-[#F1F2FA] transition-colors shadow-xs"
          id="refresh-gigs-btn"
        >
          <RefreshCw className={clsx("w-3.5 h-3.5 text-[#5F6878]", loading && "animate-spin")} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Marketplace scope notice */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[#F8F8FC] border border-[#E2E4EE] text-xs text-[#5F6878]">
        <Info className="w-4 h-4 text-[#8A93A3] shrink-0 mt-0.5" />
        <span>
          This marketplace shows only <strong className="text-[#172033]">open gigs</strong> accepting new bids.
          {isAuthenticated
            ? " Your active, in-progress, and disputed contracts are in "
            : " Sign in to view your active contracts in "}
          <button
            onClick={() => navigate(isAuthenticated ? "/my-contracts" : "/auth?returnTo=/my-contracts")}
            className="font-semibold text-[#176B4A] hover:underline"
          >
            My Contracts
          </button>
          .
        </span>
      </div>

      {!GIGESCROW_ADDRESS && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-900 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="font-semibold">Contracts not deployed</p>
            <p className="text-xs text-amber-700 mt-0.5">No on-chain data available. Please verify your contract addresses in configuration.</p>
          </div>
        </div>
      )}

      {/* Filters Box */}
      <div className="bg-white border border-[#E2E4EE] rounded-xl p-4 flex flex-col lg:flex-row gap-4 shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8A93A3]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search open gigs by description, client address, or Gig ID..."
            className="w-full bg-[#F8F8FC] border border-[#E2E4EE] rounded-lg pl-10 pr-4 py-2 text-sm text-[#172033] placeholder:text-[#8A93A3] focus:outline-none focus:border-[#176B4A] focus:bg-white transition-colors"
            id="gig-search-input"
          />
        </div>

        {/* Token filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#8A93A3] font-medium shrink-0">Token:</span>
          {(["all", "eth", "erc20"] as TokenFilter[]).map((t) => (
            <button
              key={t}
              onClick={() => setTokenFilter(t)}
              className={clsx(
                "px-2.5 py-1.5 rounded-lg text-xs font-medium uppercase tracking-wider transition-all",
                tokenFilter === t
                  ? "bg-[#E8F5EE] text-[#176B4A] border border-[#23895A]/30 font-semibold"
                  : "text-[#8A93A3] hover:text-[#172033]"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Gig Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array(6)
            .fill(null)
            .map((_, i) => (
              <div key={i} className="h-64 rounded-xl border border-[#E2E4EE] bg-white animate-pulse" />
            ))}
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
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center rounded-xl border border-[#E2E4EE] bg-white shadow-xs">
          <Briefcase className="w-10 h-10 text-[#8A93A3] mx-auto mb-3" />
          <h3 className="text-base font-bold text-[#172033] mb-1">
            {search || tokenFilter !== "all" ? "No matching open gigs" : "No open gigs available"}
          </h3>
          <p className="text-xs text-[#5F6878]">
            {search || tokenFilter !== "all"
              ? "Try adjusting your search or token filter."
              : "There are no gigs currently accepting bids on the smart contract."}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((gig) => (
            <div key={Number(gig.gigId)} className="flex flex-col">
              <GigCard gig={gig} currentAddress={address} />
              {/* Bid button — only for non-clients on open gigs */}
              {gig.client.toLowerCase() !== address?.toLowerCase() && (
                <div className="mt-2">
                  <button
                    onClick={() => handleBid(gig)}
                    disabled={bidding === Number(gig.gigId)}
                    id={`bid-gig-${Number(gig.gigId)}`}
                    className="w-full py-2 px-3 rounded-lg bg-[#176B4A] hover:bg-[#13583C] text-white text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {bidding === Number(gig.gigId) ? "Placing bid..." : "Place Bid with Stake"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {content}
      </div>
    );
  }

  return (
    <DashboardShell>
      {content}
    </DashboardShell>
  );
}
