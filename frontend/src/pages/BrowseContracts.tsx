import { useState } from "react";
import { Search, SlidersHorizontal, RefreshCw, AlertCircle, Briefcase } from "lucide-react";
import { useAllGigs } from "../hooks/useGig";
import { useGigEscrowContract } from "../hooks/useContract";
import { useWallet } from "../context/WalletContext";
import { useToast } from "../components/TransactionToast";
import GigCard from "../components/GigCard";
import DashboardShell from "../components/DashboardShell";
import { GigState, type Gig, ETH_ADDRESS } from "../lib/types";
import { GIGESCROW_ADDRESS } from "../lib/contracts";
import clsx from "clsx";

type FilterState = "all" | "open" | "inprogress" | "completed" | "disputed";
type TokenFilter = "all" | "eth" | "erc20";

export default function BrowseContracts() {
  const { address, isConnected } = useWallet();
  const contract = useGigEscrowContract();
  const { txPending, txSuccess, txError } = useToast();
  const { gigs, loading, error, refetch } = useAllGigs(50);
  const [stateFilter, setStateFilter] = useState<FilterState>("all");
  const [tokenFilter, setTokenFilter] = useState<TokenFilter>("all");
  const [search, setSearch] = useState("");
  const [bidding, setBidding] = useState<number | null>(null);

  const handleBid = async (gig: Gig) => {
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

  const filtered = gigs.filter((g) => {
    if (stateFilter === "open" && g.state !== GigState.Open) return false;
    if (stateFilter === "inprogress" && g.state !== GigState.InProgress) return false;
    if (stateFilter === "completed" && g.state !== GigState.Completed) return false;
    if (stateFilter === "disputed" && g.state !== GigState.Disputed) return false;
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

  const stateButtons: { key: FilterState; label: string }[] = [
    { key: "all", label: "All" },
    { key: "open", label: "Open" },
    { key: "inprogress", label: "In Progress" },
    { key: "completed", label: "Completed" },
    { key: "disputed", label: "Disputed" },
  ];

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E2E4EE]">
          <div>
            <h1 className="text-2xl font-bold text-[#172033] tracking-tight">Browse Gigs</h1>
            <p className="text-[#5F6878] text-sm mt-0.5">
              Explore on-chain escrow opportunities ·{" "}
              <span className="font-semibold text-[#172033]">{gigs.length}</span> total on-chain ·{" "}
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
              placeholder="Search by description, wallet address, or Gig ID..."
              className="w-full bg-[#F8F8FC] border border-[#E2E4EE] rounded-lg pl-10 pr-4 py-2 text-sm text-[#172033] placeholder:text-[#8A93A3] focus:outline-none focus:border-[#176B4A] focus:bg-white transition-colors"
              id="gig-search-input"
            />
          </div>

          {/* State Filter Pills */}
          <div className="flex gap-1.5 flex-wrap items-center">
            {stateButtons.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setStateFilter(key)}
                id={`filter-${key}`}
                className={clsx(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                  stateFilter === key
                    ? "bg-[#E8F5EE] text-[#176B4A] border border-[#23895A]/30 shadow-xs"
                    : "bg-white text-[#5F6878] border border-[#E2E4EE] hover:text-[#172033] hover:bg-[#F1F2FA]"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Token Filter Pills */}
          <div className="flex gap-1.5 items-center">
            {(["all", "eth", "erc20"] as TokenFilter[]).map((t) => (
              <button
                key={t}
                onClick={() => setTokenFilter(t)}
                id={`token-filter-${t}`}
                className={clsx(
                  "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all uppercase",
                  tokenFilter === t
                    ? "bg-[#EEEAFB] text-[#7567C7] border border-[#7567C7]/30 shadow-xs"
                    : "bg-white text-[#5F6878] border border-[#E2E4EE] hover:text-[#172033] hover:bg-[#F1F2FA]"
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array(6)
              .fill(null)
              .map((_, i) => (
                <div key={i} className="bg-white border border-[#E2E4EE] rounded-xl p-5 space-y-3 shadow-xs">
                  <div className="h-4 bg-[#F1F2FA] rounded w-3/4 animate-pulse" />
                  <div className="h-16 bg-[#F1F2FA] rounded animate-pulse" />
                  <div className="h-4 bg-[#F1F2FA] rounded w-1/2 animate-pulse" />
                </div>
              ))}
          </div>
        ) : error ? (
          <div className="bg-white border border-[#E2E4EE] rounded-xl text-center py-16 px-4 shadow-xs">
            <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
            <p className="text-[#172033] font-bold text-base mb-1">Failed to load gigs from blockchain</p>
            <p className="text-[#5F6878] text-xs max-w-md mx-auto mb-4">{error}</p>
            <button
              onClick={refetch}
              className="px-4 py-2 rounded-lg bg-[#176B4A] hover:bg-[#13583C] text-white text-xs font-semibold transition-colors"
            >
              Retry On-Chain Query
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-[#E2E4EE] rounded-xl text-center py-16 px-4 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-[#F1F2FA] flex items-center justify-center mx-auto mb-3">
              <Briefcase className="w-6 h-6 text-[#8A93A3]" />
            </div>
            <p className="text-[#172033] font-bold text-base mb-1">No gigs match your criteria</p>
            <p className="text-[#5F6878] text-xs max-w-md mx-auto">
              {search || stateFilter !== "all" || tokenFilter !== "all"
                ? "Try adjusting your search terms or filter selection."
                : "No active gigs currently exist on the smart contract."}
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((gig) => (
              <div key={Number(gig.gigId)} className="flex flex-col">
                <GigCard gig={gig} currentAddress={address} />
                {isConnected && gig.state === GigState.Open && gig.client.toLowerCase() !== address?.toLowerCase() && (
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
    </DashboardShell>
  );
}

