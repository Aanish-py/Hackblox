/**
 * ArbitrationDashboard — GigChain Protocol Arbitrator Workspace
 *
 * This page is accessible to any authenticated wallet, but meaningful
 * content is ONLY shown to the wallet that matches deployedContract.arbitrator().
 *
 * Access model:
 *   - Wallet === contract.arbitrator() → full arbitration workspace
 *   - Any other wallet               → clear "not the arbitrator" diagnostic
 *
 * No fake data. Only real on-chain disputed gigs are surfaced.
 */
import { useNavigate, Link } from "react-router-dom";
import {
  Scale,
  Loader2,
  AlertTriangle,
  ShieldCheck,
  ShieldOff,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { useWallet } from "../context/WalletContext";
import { useAllGigs } from "../hooks/useGig";
import { useArbitrator } from "../hooks/useArbitrator";
import DashboardShell from "../components/DashboardShell";
import { GigState, formatEther, shortenAddress } from "../lib/types";
import { Navigate } from "react-router-dom";

export default function ArbitrationDashboard() {
  const { address, isAuthenticated, isAuthChecking } = useWallet();
  const { arbitratorAddress, loading: arbitratorLoading, error: arbitratorError } = useArbitrator();
  const { gigs, loading: gigsLoading, error: gigsError, refetch } = useAllGigs(200);
  const navigate = useNavigate();

  // ── Auth guard ────────────────────────────────────────────────────────────
  if (isAuthChecking) {
    return (
      <DashboardShell>
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-7 h-7 text-[#176B4A] animate-spin" />
          <p className="text-xs text-[#5F6878]">Checking session…</p>
        </div>
      </DashboardShell>
    );
  }

  if (!isAuthenticated || !address) {
    return <Navigate to="/auth?returnTo=/arbitration" replace />;
  }

  // ── Phase 1: Resolving arbitrator identity from contract ──────────────────
  if (arbitratorLoading) {
    return (
      <DashboardShell>
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-7 h-7 text-[#176B4A] animate-spin" />
          <p className="text-xs text-[#5F6878]">Reading arbitrator address from deployed contract…</p>
        </div>
      </DashboardShell>
    );
  }

  // ── Phase 2: Contract read error ──────────────────────────────────────────
  if (arbitratorError) {
    return (
      <DashboardShell>
        <div className="max-w-xl mx-auto my-16 space-y-4">
          <div className="bg-white border border-red-200 rounded-2xl p-8 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#172033]">Unable to determine arbitration authority</h2>
                <p className="text-xs text-[#5F6878] mt-0.5">
                  The deployed GigEscrow contract could not be queried.
                </p>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-[#F8F8FC] border border-[#E2E4EE] font-mono text-[11px] text-red-700 break-all">
              {arbitratorError}
            </div>
            <p className="text-xs text-[#5F6878]">
              Arbitration controls will not be activated until the contract arbitrator address
              can be confirmed. No wallet is assumed to be the arbitrator.
            </p>
            <button
              onClick={() => navigate("/my-contracts")}
              className="px-4 py-2 rounded-lg border border-[#E2E4EE] bg-white hover:bg-[#F1F2FA] text-xs font-semibold text-[#172033] transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </DashboardShell>
    );
  }

  // ── Phase 3: Role check — is this wallet the contract arbitrator? ─────────
  const isArbitrator =
    !!arbitratorAddress &&
    !!address &&
    address.toLowerCase() === arbitratorAddress.toLowerCase();

  // ── Phase 4: Not the arbitrator — show clear diagnostic ──────────────────
  if (!isArbitrator) {
    return (
      <DashboardShell>
        <div className="max-w-xl mx-auto my-16">
          <div className="bg-white border border-[#E2E4EE] rounded-2xl p-10 shadow-xs space-y-5 text-center">
            <div className="w-14 h-14 rounded-full bg-[#F1F2FA] border border-[#E2E4EE] flex items-center justify-center mx-auto">
              <ShieldOff className="w-7 h-7 text-[#5F6878]" />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-[#172033]">
                Connected wallet is not the contract-authorized arbitrator
              </h2>
              <p className="text-sm text-[#5F6878] leading-relaxed">
                The GigChain Protocol Arbitrator role is enforced by the deployed
                smart contract. Only the wallet returned by{" "}
                <code className="font-mono text-xs bg-[#F1F2FA] px-1.5 py-0.5 rounded border border-[#E2E4EE]">
                  GigEscrow.arbitrator()
                </code>{" "}
                can access this workspace.
              </p>
            </div>

            {/* Show what the contract says vs what's connected */}
            <div className="text-left space-y-2 pt-2">
              <div className="flex items-start justify-between gap-4 p-3 rounded-lg bg-[#F8F8FC] border border-[#E2E4EE] text-xs">
                <span className="text-[#8A93A3] font-semibold uppercase tracking-wider shrink-0">
                  Contract arbitrator
                </span>
                <span className="font-mono text-[#172033] font-bold text-right break-all" title={arbitratorAddress ?? undefined}>
                  {arbitratorAddress ? shortenAddress(arbitratorAddress, 6) : "Unknown"}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4 p-3 rounded-lg bg-[#F8F8FC] border border-[#E2E4EE] text-xs">
                <span className="text-[#8A93A3] font-semibold uppercase tracking-wider shrink-0">
                  Connected wallet
                </span>
                <span className="font-mono text-[#172033] font-bold text-right break-all" title={address}>
                  {shortenAddress(address, 6)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-red-50 border border-red-200 text-xs">
                <span className="text-red-800 font-semibold">Address match</span>
                <span className="font-bold text-red-700">NO</span>
              </div>
            </div>

            <p className="text-xs text-[#8A93A3] leading-relaxed">
              To access the arbitration workspace, connect the MetaMask account
              that matches the contract arbitrator address. No frontend change can
              grant this role — only the smart contract governs it.
            </p>

            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                onClick={() => navigate("/my-contracts")}
                className="px-4 py-2 rounded-lg border border-[#E2E4EE] bg-white hover:bg-[#F1F2FA] text-xs font-semibold text-[#172033] transition-colors"
              >
                Back to Dashboard
              </button>
              <a
                href={`https://sepolia.etherscan.io/address/${arbitratorAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#F1F2FA] hover:bg-[#E2E4EE] border border-[#E2E4EE] text-xs font-semibold text-[#172033] transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#8A93A3]" />
                View Arbitrator on Etherscan
              </a>
            </div>
          </div>
        </div>
      </DashboardShell>
    );
  }

  // ── Phase 5: Confirmed arbitrator — render full workspace ─────────────────
  const disputedGigs = gigs.filter((g) => g.state === GigState.Disputed);

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Header — Arbitrator identity confirmed from contract */}
        <div className="pb-3 border-b border-[#E2E4EE]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] border border-[#F59E0B]/30 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#172033] tracking-tight">
                  Arbitration Workspace
                </h1>
                <p className="text-xs text-[#5F6878] mt-0.5">
                  Protocol arbitrator authority confirmed from deployed contract.
                </p>
              </div>
            </div>

            {/* Arbitrator role confirmation badge */}
            <div className="flex flex-col items-start sm:items-end gap-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#FEF3C7] text-amber-800 border border-[#F59E0B]/40">
                <ShieldCheck className="w-3.5 h-3.5" />
                GIGCHAIN PROTOCOL ARBITRATOR
              </span>
              <span className="font-mono text-[11px] text-[#8A93A3]" title={address}>
                {shortenAddress(address, 8)}
              </span>
            </div>
          </div>
        </div>

        {/* Contract authority confirmation card */}
        <div className="p-4 rounded-xl bg-[#FFFBEB] border border-[#F59E0B]/30 text-xs text-amber-900 flex items-start gap-3">
          <ShieldCheck className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-semibold">
              Authority source: <code className="font-mono bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200">GigEscrow.arbitrator()</code>
            </p>
            <p className="text-amber-800">
              Contract arbitrator:{" "}
              <span className="font-mono font-bold" title={arbitratorAddress ?? undefined}>
                {arbitratorAddress}
              </span>
            </p>
            <p className="text-amber-700 text-[11px]">
              On-chain fund resolution is controlled exclusively by the smart contract.
              This workspace provides the UI for confirmed arbitrators only.
            </p>
          </div>
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-[#E2E4EE] bg-white shadow-xs">
            <p className="text-[11px] font-bold uppercase text-[#8A93A3] mb-2">Disputed Cases</p>
            <p className="text-2xl font-bold font-mono text-red-700">{disputedGigs.length}</p>
            <p className="text-[11px] text-[#5F6878] mt-1">Requiring arbitration</p>
          </div>
          <div className="p-4 rounded-xl border border-[#E2E4EE] bg-white shadow-xs">
            <p className="text-[11px] font-bold uppercase text-[#8A93A3] mb-2">Total Gigs</p>
            <p className="text-2xl font-bold font-mono text-[#172033]">{gigs.length}</p>
            <p className="text-[11px] text-[#5F6878] mt-1">On-chain contracts</p>
          </div>
          <div className="p-4 rounded-xl border border-[#E2E4EE] bg-white shadow-xs">
            <p className="text-[11px] font-bold uppercase text-[#8A93A3] mb-2">Network</p>
            <p className="text-sm font-bold font-mono text-[#176B4A]">Sepolia</p>
            <p className="text-[11px] text-[#5F6878] mt-1">Ethereum Testnet</p>
          </div>
        </div>

        {/* Disputed cases list */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-1 border-b border-[#E2E4EE]">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-red-500" />
              <h2 className="text-sm font-bold text-[#172033]">
                Active Dispute Cases ({disputedGigs.length})
              </h2>
            </div>
            <button
              onClick={refetch}
              id="arbitration-refresh-btn"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#E2E4EE] text-xs font-semibold text-[#172033] hover:bg-[#F1F2FA] transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#5F6878] ${gigsLoading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {gigsLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-24 rounded-xl border border-[#E2E4EE] bg-white animate-pulse" />
              ))}
            </div>
          ) : gigsError ? (
            <div className="p-5 rounded-xl border border-red-200 bg-red-50 text-xs">
              <div className="flex items-center gap-2 text-red-700 font-semibold mb-1">
                <AlertCircle className="w-4 h-4" />
                Failed to load contracts from Ethereum Sepolia
              </div>
              <p className="text-[#5F6878] font-mono text-[11px] break-all mb-3">{gigsError}</p>
              <button
                onClick={() => refetch()}
                className="px-3 py-1.5 rounded-lg bg-white border border-[#E2E4EE] text-xs font-semibold text-[#172033] hover:bg-[#F1F2FA] transition-colors"
              >
                Retry
              </button>
            </div>
          ) : disputedGigs.length === 0 ? (
            <div className="p-12 text-center rounded-xl border border-[#E2E4EE] bg-white shadow-xs">
              <Scale className="w-10 h-10 text-[#8A93A3] mx-auto mb-3" />
              <h3 className="text-base font-bold text-[#172033] mb-1">
                No disputes requiring arbitration
              </h3>
              <p className="text-xs text-[#5F6878]">
                There are currently no gigs in a disputed state on the smart contract.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {disputedGigs.map((gig) => (
                <div
                  key={Number(gig.gigId)}
                  className="bg-white border border-red-100 rounded-xl p-5 shadow-xs hover:border-red-200 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-2 min-w-0">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono text-xs text-[#176B4A] font-bold shrink-0">
                          #{Number(gig.gigId)}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-700 border border-red-200">
                          Disputed
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-[#172033] truncate max-w-md">
                        {gig.description}
                      </p>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs text-[#5F6878]">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A93A3] block">
                            Client
                          </span>
                          <span className="font-mono text-[#172033]">
                            {shortenAddress(gig.client, 6)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A93A3] block">
                            Freelancer
                          </span>
                          <span className="font-mono text-[#172033]">
                            {shortenAddress(gig.freelancer, 6)}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A93A3] block">
                            Budget
                          </span>
                          <span className="font-semibold text-[#176B4A]">
                            {formatEther(gig.totalBudget)} ETH
                          </span>
                        </div>
                      </div>
                    </div>

                    <Link
                      to={`/dispute/${Number(gig.gigId)}`}
                      id={`open-dossier-${Number(gig.gigId)}`}
                      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors shadow-xs shrink-0 self-start sm:self-center"
                    >
                      <Scale className="w-3.5 h-3.5" />
                      <span>Open Arbitration Dossier</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
