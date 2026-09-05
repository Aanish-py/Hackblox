import { useState, useEffect } from "react";
import { Search, Filter, SlidersHorizontal, RefreshCw, AlertCircle } from "lucide-react";
import { useAllGigs } from "../hooks/useGig";
import { useGigEscrowContract } from "../hooks/useContract";
import { useWallet } from "../context/WalletContext";
import { useToast } from "../components/TransactionToast";
import GigCard from "../components/GigCard";
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
      if (!g.description.toLowerCase().includes(q) &&
          !g.client.toLowerCase().includes(q) &&
          !String(Number(g.gigId)).includes(q)) return false;
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
    <div className="min-h-screen py-10 px-4 page-enter">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="heading-lg mb-1">Browse Gigs</h1>
            <p className="text-slate-400 text-sm">
              {gigs.length} gigs on-chain · {filtered.length} shown
            </p>
          </div>
          <button onClick={refetch} className="btn-secondary text-sm py-2" id="refresh-gigs-btn">
            <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
            Refresh
          </button>
        </div>

        {!GIGESCROW_ADDRESS && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6 text-yellow-400 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            Contracts not deployed. No on-chain data available. Deploy contracts first.
          </div>
        )}

        {/* Filters */}
        <div className="glass-card p-4 mb-6 flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by description, address, or ID..."
              className="input-field pl-10 text-sm"
              id="gig-search-input"
            />
          </div>

          {/* State filter */}
          <div className="flex gap-1.5 flex-wrap">
            {stateButtons.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setStateFilter(key)}
                id={`filter-${key}`}
                className={clsx(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                  stateFilter === key
                    ? "bg-brand-600/30 text-brand-300 border border-brand-600/40"
                    : "text-slate-500 hover:text-slate-300 hover:bg-space-600"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Token filter */}
          <div className="flex gap-1.5">
            {(["all", "eth", "erc20"] as TokenFilter[]).map((t) => (
              <button
                key={t}
                onClick={() => setTokenFilter(t)}
                id={`token-filter-${t}`}
                className={clsx(
                  "px-3 py-1.5 rounded-lg text-sm font-medium transition-all",
                  tokenFilter === t
                    ? "bg-cyan-600/20 text-cyan-300 border border-cyan-600/30"
                    : "text-slate-500 hover:text-slate-300 hover:bg-space-600"
                )}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array(6).fill(null).map((_, i) => (
              <div key={i} className="glass-card p-5 space-y-3">
                <div className="skeleton h-4 w-3/4" />
                <div className="skeleton h-12" />
                <div className="skeleton h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="text-red-400 font-semibold mb-1">Failed to load gigs</p>
            <p className="text-slate-500 text-sm mb-4">{error}</p>
            <button onClick={refetch} className="btn-secondary">Retry</button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <SlidersHorizontal className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 font-semibold mb-1">No gigs found</p>
            <p className="text-slate-500 text-sm">Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((gig) => (
              <div key={Number(gig.gigId)} className="relative">
                <GigCard gig={gig} currentAddress={address} />
                {/* Bid button overlay for open gigs */}
                {isConnected && gig.state === GigState.Open && gig.client.toLowerCase() !== address?.toLowerCase() && (
                  <div className="mt-2">
                    <button
                      onClick={() => handleBid(gig)}
                      disabled={bidding === Number(gig.gigId)}
                      id={`bid-gig-${Number(gig.gigId)}`}
                      className="btn-primary w-full text-sm py-2"
                    >
                      {bidding === Number(gig.gigId) ? "Placing bid..." : "Place Bid"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
