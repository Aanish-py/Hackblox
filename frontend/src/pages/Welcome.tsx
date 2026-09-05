import { Link } from "react-router-dom";
import {
  Shield,
  ArrowRight,
  ChevronRight,
  Award,
  Scale,
  Bot,
  Lock,
  FileCheck,
  CheckCircle2,
  Clock,
  Activity,
} from "lucide-react";
import { useWallet } from "../context/WalletContext";
import GigChainLogo from "../components/GigChainLogo";
import { BadgeType, BadgeEmoji } from "../lib/types";

// ─── 3 representative badge concepts from actual smart contract ──────────────
const badgeHighlights = [
  {
    type: BadgeType.COMPLETED_GIGS,
    name: "Completed Gigs",
    emoji: BadgeEmoji[BadgeType.COMPLETED_GIGS],
    desc: "Awarded for verified delivery across completed contracts.",
  },
  {
    type: BadgeType.EARNINGS_MILESTONE,
    name: "Earnings Milestone",
    emoji: BadgeEmoji[BadgeType.EARNINGS_MILESTONE],
    desc: "Recognizes cumulative volume earned on-chain.",
  },
  {
    type: BadgeType.STREAK,
    name: "Winning Streak",
    emoji: BadgeEmoji[BadgeType.STREAK],
    desc: "Minted for consecutive on-time milestone deliveries.",
  },
];

export default function Welcome() {
  const { isConnected, connect, isConnecting } = useWallet();

  return (
    <div className="min-h-screen bg-[#F8F8FC] text-[#172033] selection:bg-[#E8F5EE] selection:text-[#176B4A]">

      {/* ─── SECTION 1: HERO ──────────────────────────────────────────────── */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 px-4 sm:px-6 lg:px-8 border-b border-[#E2E4EE]">
        <div className="max-w-6xl mx-auto">
          {/* Eyebrow */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-[#23895A]/30 bg-[#E8F5EE] text-xs font-semibold text-[#176B4A]">
              <span className="w-2 h-2 rounded-full bg-[#176B4A] animate-pulse" />
              <span>Trustless Freelance Escrow</span>
              <span className="text-[#A7D7C2]">|</span>
              <span className="text-[#23895A]">Ethereum Sepolia</span>
            </div>
          </div>

          {/* Headline */}
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-[#172033] tracking-tight leading-[1.15] mb-6">
              Freelance work,{" "}
              <span className="text-[#176B4A]">
                secured from the start.
              </span>
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-[#5F6878] max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
              GigChain connects clients and freelancers through milestone-based
              work protected by smart contract escrow. Funds are locked before
              work begins and released automatically upon approval.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/browse"
                id="hero-browse-btn"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-lg bg-[#176B4A] hover:bg-[#13583C] text-white font-medium text-sm transition-colors shadow-xs"
              >
                <span>Browse Gigs</span>
                <ArrowRight className="w-4 h-4 text-emerald-200" />
              </Link>

              {isConnected ? (
                <Link
                  to="/post-gig"
                  id="hero-post-btn"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg border border-[#E2E4EE] hover:border-[#CBD2DE] bg-white text-[#172033] hover:bg-[#F1F2FA] font-medium text-sm transition-colors shadow-xs"
                >
                  <span>Post a Gig</span>
                  <ChevronRight className="w-4 h-4 text-[#8A93A3]" />
                </Link>
              ) : (
                <button
                  onClick={connect}
                  disabled={isConnecting}
                  id="hero-connect-btn"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-lg border border-[#E2E4EE] hover:border-[#CBD2DE] bg-white text-[#172033] hover:bg-[#F1F2FA] font-medium text-sm transition-colors shadow-xs"
                >
                  <span>{isConnecting ? "Connecting..." : "Connect Wallet"}</span>
                  <ChevronRight className="w-4 h-4 text-[#8A93A3]" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 2: ESCROW EXECUTION PIPELINE ────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-[#E2E4EE] bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between pb-4 mb-8 border-b border-[#E2E4EE]">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#176B4A]" />
              <span className="text-xs font-semibold uppercase tracking-wider text-[#172033]">
                Escrow Execution Pipeline
              </span>
            </div>
            <span className="text-xs text-[#8A93A3] font-mono font-medium">GigEscrow.sol</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Deposit */}
            <div className="rounded-lg border border-[#E2E4EE] bg-[#F8F8FC] p-4 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-mono text-[#176B4A] font-semibold">01 / DEPOSIT</span>
                <h4 className="text-sm font-semibold text-[#172033] mt-1 mb-1">Client Funds</h4>
                <p className="text-xs text-[#5F6878] leading-relaxed">
                  ETH deposited directly into the smart contract escrow.
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-[#E2E4EE] flex items-center gap-1.5 text-[11px] text-[#176B4A] font-medium">
                <Lock className="w-3 h-3" />
                <span>Non-custodial lock</span>
              </div>
            </div>

            {/* Milestone */}
            <div className="rounded-lg border border-[#E2E4EE] bg-[#F8F8FC] p-4 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-mono text-[#176B4A] font-semibold">02 / MILESTONE</span>
                <h4 className="text-sm font-semibold text-[#172033] mt-1 mb-1">Work Begins</h4>
                <p className="text-xs text-[#5F6878] leading-relaxed">
                  Freelancer works knowing funds are already locked on-chain.
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-[#E2E4EE] flex items-center gap-1.5 text-[11px] text-[#5F6878]">
                <Clock className="w-3 h-3 text-[#8A93A3]" />
                <span>In-progress status</span>
              </div>
            </div>

            {/* Deliver */}
            <div className="rounded-lg border border-[#E2E4EE] bg-[#F8F8FC] p-4 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-mono text-[#176B4A] font-semibold">03 / DELIVER</span>
                <h4 className="text-sm font-semibold text-[#172033] mt-1 mb-1">IPFS Proof</h4>
                <p className="text-xs text-[#5F6878] leading-relaxed">
                  Deliverables submitted with immutable cryptographic hash.
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-[#E2E4EE] flex items-center gap-1.5 text-[11px] text-[#5F6878]">
                <FileCheck className="w-3 h-3 text-[#8A93A3]" />
                <span>Immutable evidence</span>
              </div>
            </div>

            {/* Release */}
            <div className="rounded-lg border border-[#23895A]/30 bg-[#E8F5EE] p-4 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-mono text-[#176B4A] font-semibold">04 / RELEASE</span>
                <h4 className="text-sm font-semibold text-[#176B4A] mt-1 mb-1">Direct Payout</h4>
                <p className="text-xs text-[#13583C] leading-relaxed">
                  Client approval triggers on-chain transfer to freelancer.
                </p>
              </div>
              <div className="mt-4 pt-2 border-t border-[#23895A]/20 flex items-center gap-1.5 text-[11px] text-[#176B4A] font-semibold">
                <CheckCircle2 className="w-3 h-3" />
                <span>Settlement</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 3: WHY GIGCHAIN ──────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-[#E2E4EE] bg-[#F1F2FA]">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 text-center">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#176B4A] mb-2 font-mono">
              Why GigChain
            </h2>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-[#172033]">
              Built for trustless collaboration
            </h3>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-[#E2E4EE] bg-white p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-[#E8F5EE] text-[#176B4A] flex items-center justify-center mb-3">
                  <Lock className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-semibold text-[#172033] mb-1">Non-Custodial Escrow</h4>
                <p className="text-xs text-[#5F6878] leading-relaxed">
                  Funds remain in the existing smart-contract escrow flow.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-[#E2E4EE] bg-white p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-[#E8F5EE] text-[#176B4A] flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-semibold text-[#172033] mb-1">Milestone-Based</h4>
                <p className="text-xs text-[#5F6878] leading-relaxed">
                  Payments follow agreed deliverables.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-[#E2E4EE] bg-white p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-[#E8F5EE] text-[#176B4A] flex items-center justify-center mb-3">
                  <Activity className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-semibold text-[#172033] mb-1">Transparent</h4>
                <p className="text-xs text-[#5F6878] leading-relaxed">
                  Contract state can be verified on-chain.
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-[#E2E4EE] bg-white p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-lg bg-[#E8F5EE] text-[#176B4A] flex items-center justify-center mb-3">
                  <Award className="w-4 h-4" />
                </div>
                <h4 className="text-sm font-semibold text-[#172033] mb-1">Verifiable Reputation</h4>
                <p className="text-xs text-[#5F6878] leading-relaxed">
                  Completed work contributes to the existing ERC-721 reputation system.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 4: REPUTATION + DISPUTE RESOLUTION ───────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-[#E2E4EE] bg-white">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10">

          {/* LEFT: Reputation */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-4 h-4 text-[#176B4A]" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#176B4A] font-mono">Reputation</h3>
            </div>
            <h4 className="text-xl font-display font-bold text-[#172033] mb-3">On-Chain Track Record</h4>
            <p className="text-sm text-[#5F6878] mb-6 leading-relaxed">
              Completed work contributes to a verifiable reputation through the
              existing badge system.
            </p>

            <div className="space-y-3">
              {badgeHighlights.map(({ type, name, emoji, desc }) => (
                <div
                  key={type}
                  className="rounded-lg border border-[#E2E4EE] bg-[#F8F8FC] p-3.5 flex items-start gap-3"
                >
                  <div className="text-xl shrink-0 mt-0.5">{emoji}</div>
                  <div>
                    <div className="text-xs font-semibold text-[#172033] mb-0.5">{name}</div>
                    <div className="text-[11px] text-[#5F6878] leading-relaxed">{desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5">
              <Link
                to="/reputation"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#176B4A] hover:text-[#13583C] transition-colors"
              >
                <span>Explore Reputation</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* RIGHT: Disputes */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Scale className="w-4 h-4 text-[#176B4A]" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#176B4A] font-mono">Dispute Resolution</h3>
            </div>
            <h4 className="text-xl font-display font-bold text-[#172033] mb-3">Evidence-Based Arbitration</h4>
            <p className="text-sm text-[#5F6878] mb-6 leading-relaxed">
              When a milestone is contested, the existing dispute flow moves through
              evidence review and arbitration.
            </p>

            <div className="space-y-3">
              {[
                { stage: "01", title: "Issue Raised", desc: "Either party flags an impasse with a documented explanation.", icon: Scale },
                { stage: "02", title: "Evidence Logged", desc: "Both parties submit statements and deliverables with permanent IPFS hashes.", icon: FileCheck },
                { stage: "03", title: "AI Assessment", desc: "Objective analysis compares deliverables against stated milestone criteria.", icon: Bot },
                { stage: "04", title: "Arbitrator Verdict", desc: "Arbitrator reviews all evidence and executes final on-chain fund distribution.", icon: Shield },
              ].map(({ stage, title, desc }) => (
                <div key={stage} className="flex gap-3 items-start rounded-lg border border-[#E2E4EE] bg-[#F8F8FC] p-3.5">
                  <span className="text-xs font-mono font-bold text-[#176B4A] w-6 shrink-0 pt-0.5">{stage}</span>
                  <div>
                    <div className="text-xs font-semibold text-[#172033] mb-0.5">{title}</div>
                    <div className="text-[11px] text-[#5F6878] leading-relaxed">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>



      {/* ─── SECTION 6: FOOTER ────────────────────────────────────────────── */}
      <footer className="py-10 px-4 sm:px-6 lg:px-8 bg-white border-t border-[#E2E4EE]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-[#E2E4EE]">
            <div>
              <div className="mb-2">
                <GigChainLogo variant="horizontal" size="sm" theme="light" />
              </div>
              <p className="text-xs text-[#5F6878] max-w-sm">
                Trustless freelance escrow protocol powered by smart contracts and milestone settlement.
              </p>
            </div>

            <div className="flex flex-wrap gap-6 text-xs text-[#5F6878]">
              <Link to="/browse" className="hover:text-[#172033] transition-colors font-medium">Browse Gigs</Link>
              <Link to="/post-gig" className="hover:text-[#172033] transition-colors font-medium">Post a Gig</Link>
              <Link to="/my-contracts" className="hover:text-[#172033] transition-colors font-medium">Dashboard</Link>
              <Link to="/reputation" className="hover:text-[#172033] transition-colors font-medium">Reputation</Link>
              <Link to="/profile" className="hover:text-[#172033] transition-colors font-medium">Profile</Link>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8A93A3]">
            <p>© 2026 GigChain. Built for Hackblox / SIH 2026.</p>
            <div className="flex items-center gap-4">
              <span>Ethereum Sepolia Testnet</span>
              <span>·</span>
              <span>Non-Custodial</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
