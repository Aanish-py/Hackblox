import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
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
import api from "../lib/api";
import { BadgeNames, BadgeType, BadgeEmoji } from "../lib/types";

interface PlatformStats {
  totalGigs: number;
  totalVolume: string;
  totalUsers: number;
  totalBadges: number;
}

// ─── Badge types from actual smart contract ──────────────────────────────────
const badgeHighlights = [
  { type: BadgeType.COMPLETED_GIGS, name: BadgeNames[BadgeType.COMPLETED_GIGS], emoji: BadgeEmoji[BadgeType.COMPLETED_GIGS], desc: "Awarded for verified delivery across completed contracts." },
  { type: BadgeType.EARNINGS_MILESTONE, name: BadgeNames[BadgeType.EARNINGS_MILESTONE], emoji: BadgeEmoji[BadgeType.EARNINGS_MILESTONE], desc: "Recognizes cumulative volume earned on-chain." },
  { type: BadgeType.STREAK, name: BadgeNames[BadgeType.STREAK], emoji: BadgeEmoji[BadgeType.STREAK], desc: "Minted for consecutive on-time milestone deliveries." },
  { type: BadgeType.DISPUTE_FREE, name: BadgeNames[BadgeType.DISPUTE_FREE], emoji: BadgeEmoji[BadgeType.DISPUTE_FREE], desc: "Signifies clean execution history without contested milestones." },
];

export default function Welcome() {
  const { isConnected, connect, isConnecting } = useWallet();
  const [stats, setStats] = useState<PlatformStats | null>(null);

  useEffect(() => {
    api
      .get("/analytics/stats")
      .then((r) => setStats(r.data))
      .catch(() => setStats(null));
  }, []);

  const hasPopulatedStats =
    stats &&
    (stats.totalGigs > 0 ||
      parseFloat(stats.totalVolume) > 0 ||
      stats.totalUsers > 0 ||
      stats.totalBadges > 0);

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

      {/* ─── SECTION 3: TRUST PILLARS ─────────────────────────────────────── */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-b border-[#E2E4EE] bg-[#F1F2FA]">
        <div className="max-w-5xl mx-auto">
          {hasPopulatedStats ? (
            /* Show real platform stats when populated */
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <p className="font-display font-bold text-3xl text-[#172033]">{stats.totalGigs.toLocaleString()}</p>
                <p className="text-xs uppercase tracking-wider text-[#5F6878] font-semibold mt-1">Active Gigs</p>
              </div>
              <div>
                <p className="font-display font-bold text-3xl text-[#176B4A]">{stats.totalVolume} ETH</p>
                <p className="text-xs uppercase tracking-wider text-[#5F6878] font-semibold mt-1">Settled Volume</p>
              </div>
              <div>
                <p className="font-display font-bold text-3xl text-[#172033]">{stats.totalUsers.toLocaleString()}</p>
                <p className="text-xs uppercase tracking-wider text-[#5F6878] font-semibold mt-1">Registered Wallets</p>
              </div>
              <div>
                <p className="font-display font-bold text-3xl text-[#176B4A]">{stats.totalBadges.toLocaleString()}</p>
                <p className="text-xs uppercase tracking-wider text-[#5F6878] font-semibold mt-1">Badges Minted</p>
              </div>
            </div>
          ) : (
            /* Protocol pillars when stats are not yet populated */
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: Lock, title: "Escrow Protected", desc: "Non-custodial lock on Sepolia" },
                { icon: CheckCircle2, title: "Milestone-Based", desc: "Incremental phased payments" },
                { icon: Activity, title: "Smart-Contract Governed", desc: "Deterministic code execution" },
                { icon: Award, title: "Verifiable Reputation", desc: "ERC-721 on-chain badges" },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="p-4 rounded-xl bg-white border border-[#E2E4EE] shadow-xs flex items-start gap-3">
                  <Icon className="w-4 h-4 text-[#176B4A] mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-[#172033]">{title}</div>
                    <div className="text-[11px] text-[#8A93A3] mt-0.5">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── SECTION 4: HOW IT WORKS ──────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-[#E2E4EE]" id="how-it-works">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#176B4A] mb-2 font-mono">Workflow</h2>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-[#172033]">How GigChain Works</h3>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { step: "01", title: "Define the Work", desc: "Post a gig and structure deliverables into clear milestones, each with its own acceptance criteria and budget allocation." },
              { step: "02", title: "Fund Escrow", desc: "Milestone funds are deposited into the smart contract before work begins. Neither party can unilaterally withdraw locked capital." },
              { step: "03", title: "Submit Deliverables", desc: "The freelancer performs the work and submits deliverables with IPFS documentation recorded on-chain." },
              { step: "04", title: "Release or Resolve", desc: "Client approves to trigger fund release. Any impasse enters structured arbitration with an on-chain verdict." },
            ].map(({ step, title, desc }) => (
              <div
                key={step}
                className="rounded-xl border border-[#E2E4EE] bg-white p-6 flex gap-4 hover:border-[#CBD2DE] transition-colors shadow-xs"
              >
                <div className="text-2xl font-mono font-bold text-[#176B4A] shrink-0 w-10">{step}</div>
                <div>
                  <h4 className="text-sm font-semibold text-[#172033] mb-1.5">{title}</h4>
                  <p className="text-xs text-[#5F6878] leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SECTION 5: WHY GIGCHAIN ──────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-[#E2E4EE] bg-[#F1F2FA]">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#176B4A] mb-2 font-mono">Protocol</h2>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-[#172033]">Why GigChain</h3>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div className="rounded-xl border border-[#E2E4EE] bg-white p-6 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <Lock className="w-4 h-4 text-[#176B4A]" />
                <h4 className="text-sm font-semibold text-[#172033]">Non-Custodial Escrow</h4>
              </div>
              <p className="text-xs text-[#5F6878] leading-relaxed">
                Funds are held inside the{" "}
                <code className="px-1 py-0.5 rounded bg-[#E2E4EE] text-[#172033] text-[11px] font-mono">GigEscrow</code>{" "}
                smart contract on Ethereum Sepolia — not in a platform bank account.
                Funds can only be released by client approval or formal arbitration settlement.
              </p>
            </div>

            <div className="rounded-xl border border-[#E2E4EE] bg-white p-6 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-[#176B4A]" />
                <h4 className="text-sm font-semibold text-[#172033]">Milestone-Based Payments</h4>
              </div>
              <p className="text-xs text-[#5F6878] leading-relaxed">
                Work is divided into explicit milestones. Each milestone has its own escrow
                allocation, criteria, and approval step — reducing ambiguity and enabling
                incremental delivery.
              </p>
            </div>

            <div className="rounded-xl border border-[#E2E4EE] bg-white p-6 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-[#176B4A]" />
                <h4 className="text-sm font-semibold text-[#172033]">Transparent Contract State</h4>
              </div>
              <p className="text-xs text-[#5F6878] leading-relaxed">
                Every gig, milestone, deliverable, and fund movement is logged on-chain.
                Both parties can verify the full state of any contract on a public block explorer
                at any time.
              </p>
            </div>

            <div className="rounded-xl border border-[#E2E4EE] bg-white p-6 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-4 h-4 text-[#176B4A]" />
                <h4 className="text-sm font-semibold text-[#172033]">Verifiable Reputation</h4>
              </div>
              <p className="text-xs text-[#5F6878] leading-relaxed">
                Completed work earns ERC-721 reputation badges minted directly to your wallet.
                Your professional track record is on-chain and verifiable — not locked inside a
                private platform database.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 6: REPUTATION + DISPUTES ────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-b border-[#E2E4EE]">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10">

          {/* LEFT: Reputation */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Award className="w-4 h-4 text-[#176B4A]" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#176B4A] font-mono">Reputation</h3>
            </div>
            <h4 className="text-xl font-display font-bold text-[#172033] mb-3">On-Chain Track Record</h4>
            <p className="text-sm text-[#5F6878] mb-6 leading-relaxed">
              Every completed contract contributes to a permanent, verifiable reputation.
              ERC-721 badges are minted to your wallet — not stored in a private database —
              so your professional history follows you anywhere on-chain.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {badgeHighlights.map(({ type, name, emoji, desc }) => (
                <div
                  key={type}
                  className="rounded-lg border border-[#E2E4EE] bg-[#F8F8FC] p-3.5"
                >
                  <div className="text-lg mb-1.5">{emoji}</div>
                  <div className="text-xs font-semibold text-[#172033] mb-0.5">{name}</div>
                  <div className="text-[11px] text-[#8A93A3] leading-relaxed">{desc}</div>
                </div>
              ))}
            </div>

            <div className="mt-5">
              <Link
                to="/reputation"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#176B4A] hover:text-[#13583C] transition-colors"
              >
                <span>Explore Reputation System</span>
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
              When deliverables are contested, disputes follow a structured, transparent
              procedure — not an opaque corporate decision. All submissions are logged
              on-chain with IPFS evidence hashes.
            </p>

            <div className="space-y-3">
              {[
                { stage: "01", title: "Issue Raised", desc: "Either party flags an impasse with a documented explanation.", icon: Scale },
                { stage: "02", title: "Evidence Logged", desc: "Both parties submit statements and deliverables with permanent IPFS hashes.", icon: FileCheck },
                { stage: "03", title: "AI Assessment", desc: "Objective analysis compares deliverables against stated milestone criteria.", icon: Bot },
                { stage: "04", title: "Arbitrator Verdict", desc: "Arbitrator reviews all evidence and executes final on-chain fund distribution.", icon: Shield },
              ].map(({ stage, title, desc, icon: Icon }) => (
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



      {/* ─── FOOTER ───────────────────────────────────────────────────────── */}
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
