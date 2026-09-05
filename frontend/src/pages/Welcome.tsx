import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Shield,
  ArrowRight,
  ChevronRight,
  ExternalLink,
  Layers,
  Award,
  Scale,
  Bot,
  Lock,
  FileCheck,
  CheckCircle2,
  Clock,
  Coins,
  Flame,
  Zap,
  Activity,
  ArrowUpRight,
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

// ─── Verified Protocol Specifications (Zero-Fake-Data Fallback) ─────────────
const protocolSpecs = [
  {
    label: "Settlement Layer",
    value: "Ethereum Sepolia",
    desc: "Decentralized execution on public testnet",
    icon: Activity,
  },
  {
    label: "Platform Cut",
    value: "0% Fee",
    desc: "Clients and freelancers keep 100% of deal value",
    icon: Coins,
  },
  {
    label: "Escrow Logic",
    value: "Non-Custodial",
    desc: "Funds locked in verified smart contracts",
    icon: Lock,
  },
  {
    label: "Reputation Standard",
    value: "ERC-721 Badges",
    desc: "On-chain verifiable credentials for completed work",
    icon: Award,
  },
];

// ─── 4-Step Process ─────────────────────────────────────────────────────────
const howItWorksSteps = [
  {
    step: "01",
    title: "Define Milestones",
    desc: "The client posts a gig and structures deliverables into clear milestones with allocated budgets.",
  },
  {
    step: "02",
    title: "Fund Escrow",
    desc: "Milestone funds are deposited into the smart contract escrow before work begins. Neither party can unilaterally withdraw.",
  },
  {
    step: "03",
    title: "Submit Deliverables",
    desc: "The freelancer performs the work and submits deliverables backed by cryptographic IPFS documentation.",
  },
  {
    step: "04",
    title: "Release or Resolve",
    desc: "Client reviews and approves the deliverable to trigger instant release. Any impasse enters structured arbitration.",
  },
];

// ─── Actual Badge Types from Smart Contract ──────────────────────────────────
const badgeHighlights = [
  { type: BadgeType.COMPLETED_GIGS, name: BadgeNames[BadgeType.COMPLETED_GIGS], emoji: BadgeEmoji[BadgeType.COMPLETED_GIGS], desc: "Awarded for verified delivery across completed contracts." },
  { type: BadgeType.EARNINGS_MILESTONE, name: BadgeNames[BadgeType.EARNINGS_MILESTONE], emoji: BadgeEmoji[BadgeType.EARNINGS_MILESTONE], desc: "Recognizes cumulative volume earned on-chain." },
  { type: BadgeType.STREAK, name: BadgeNames[BadgeType.STREAK], emoji: BadgeEmoji[BadgeType.STREAK], desc: "Minted for consecutive on-time milestone deliveries." },
  { type: BadgeType.DISPUTE_FREE, name: BadgeNames[BadgeType.DISPUTE_FREE], emoji: BadgeEmoji[BadgeType.DISPUTE_FREE], desc: "Signifies clean execution history without contested milestones." },
  { type: BadgeType.INITIATIVE, name: BadgeNames[BadgeType.INITIATIVE], emoji: BadgeEmoji[BadgeType.INITIATIVE], desc: "Demonstrates proactive proposal submission and responsiveness." },
  { type: BadgeType.SPECIAL, name: BadgeNames[BadgeType.SPECIAL], emoji: BadgeEmoji[BadgeType.SPECIAL], desc: "Protocol-level distinction for top ecosystem contributors." },
];

// ─── Comparison Matrix ───────────────────────────────────────────────────────
const comparisonRows = [
  {
    feature: "Fund Custody",
    traditional: "Platform holds user funds in corporate accounts",
    gigchain: "Non-custodial smart contract escrow",
    highlight: true,
  },
  {
    feature: "Platform Take Rate",
    traditional: "5% to 20% cut from freelancer earnings",
    gigchain: "0% platform fee (network gas only)",
    highlight: true,
  },
  {
    feature: "Payment Release",
    traditional: "Discretionary clearing delays (up to 14 days)",
    gigchain: "Immediate release upon milestone approval",
    highlight: true,
  },
  {
    feature: "Work History",
    traditional: "Siloed to private platform database",
    gigchain: "Verifiable on-chain ERC-721 reputation",
    highlight: false,
  },
  {
    feature: "Dispute Procedure",
    traditional: "Opaque corporate customer support decision",
    gigchain: "Evidence-based arbitration with AI assessment",
    highlight: false,
  },
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

  // Determine whether we have populated real stats (> 0)
  const hasPopulatedStats =
    stats &&
    (stats.totalGigs > 0 ||
      parseFloat(stats.totalVolume) > 0 ||
      stats.totalUsers > 0 ||
      stats.totalBadges > 0);

  return (
    <div className="min-h-screen bg-[#F8F8FC] text-[#172033] selection:bg-[#E8F5EE] selection:text-[#176B4A]">
      {/* ─── 1. HERO SECTION ──────────────────────────────────────────────── */}
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

          {/* ─── 2. HERO VISUAL: THE ESCROW PIPELINE DIAGRAM ──────────────── */}
          <div className="mt-14 max-w-4xl mx-auto">
            <div className="rounded-xl border border-[#E2E4EE] bg-white p-5 sm:p-7 shadow-xs">
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#E2E4EE]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#176B4A]" />
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#172033]">
                    Escrow Execution Pipeline
                  </span>
                </div>
                <span className="text-xs text-[#8A93A3] font-mono font-medium">
                  GigEscrow.sol
                </span>
              </div>

              {/* Pipeline Flow Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative">
                {/* Step A */}
                <div className="rounded-lg border border-[#E2E4EE] bg-[#F8F8FC] p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-mono text-[#176B4A] font-semibold">
                      01 / DEPOSIT
                    </span>
                    <h4 className="text-sm font-semibold text-[#172033] mt-1 mb-1">
                      Client Funds
                    </h4>
                    <p className="text-xs text-[#5F6878] leading-relaxed">
                      ETH deposited directly into the smart contract escrow.
                    </p>
                  </div>
                  <div className="mt-4 pt-2 border-t border-[#E2E4EE] flex items-center gap-1.5 text-[11px] text-[#176B4A] font-medium">
                    <Lock className="w-3 h-3 text-[#176B4A]" />
                    <span>Non-custodial lock</span>
                  </div>
                </div>

                {/* Step B */}
                <div className="rounded-lg border border-[#E2E4EE] bg-[#F8F8FC] p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-mono text-[#176B4A] font-semibold">
                      02 / COMMIT
                    </span>
                    <h4 className="text-sm font-semibold text-[#172033] mt-1 mb-1">
                      Milestone Active
                    </h4>
                    <p className="text-xs text-[#5F6878] leading-relaxed">
                      Freelancer works knowing funds are already locked on-chain.
                    </p>
                  </div>
                  <div className="mt-4 pt-2 border-t border-[#E2E4EE] flex items-center gap-1.5 text-[11px] text-[#5F6878]">
                    <Clock className="w-3 h-3 text-[#8A93A3]" />
                    <span>In-progress status</span>
                  </div>
                </div>

                {/* Step C */}
                <div className="rounded-lg border border-[#E2E4EE] bg-[#F8F8FC] p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-mono text-[#176B4A] font-semibold">
                      03 / DELIVER
                    </span>
                    <h4 className="text-sm font-semibold text-[#172033] mt-1 mb-1">
                      IPFS Proof
                    </h4>
                    <p className="text-xs text-[#5F6878] leading-relaxed">
                      Deliverables submitted with immutable cryptographic hash.
                    </p>
                  </div>
                  <div className="mt-4 pt-2 border-t border-[#E2E4EE] flex items-center gap-1.5 text-[11px] text-[#5F6878]">
                    <FileCheck className="w-3 h-3 text-[#8A93A3]" />
                    <span>Immutable evidence</span>
                  </div>
                </div>

                {/* Step D */}
                <div className="rounded-lg border border-[#23895A]/30 bg-[#E8F5EE] p-4 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-mono text-[#176B4A] font-semibold">
                      04 / RELEASE
                    </span>
                    <h4 className="text-sm font-semibold text-[#176B4A] mt-1 mb-1">
                      Direct Payout
                    </h4>
                    <p className="text-xs text-[#13583C] leading-relaxed">
                      Client approval triggers immediate on-chain transfer to freelancer.
                    </p>
                  </div>
                  <div className="mt-4 pt-2 border-t border-[#23895A]/20 flex items-center gap-1.5 text-[11px] text-[#176B4A] font-semibold">
                    <CheckCircle2 className="w-3 h-3 text-[#176B4A]" />
                    <span>Instant settlement</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ─── TRUST PILLARS HORIZONTAL ROW ────────────────────────── */}
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { title: "Escrow Protected", desc: "Non-custodial lock on Sepolia" },
                { title: "Milestone-Based", desc: "Incremental phased payments" },
                { title: "Smart-Contract Governed", desc: "Deterministic code execution" },
                { title: "Reputation Backed", desc: "Verifiable ERC-721 badges" },
                { title: "Structured Arbitration", desc: "Transparent evidence & AI review" },
              ].map(({ title, desc }) => (
                <div
                  key={title}
                  className="p-3.5 rounded-xl bg-white border border-[#E2E4EE] text-center shadow-xs"
                >
                  <div className="text-xs font-semibold text-[#172033]">{title}</div>
                  <div className="text-[11px] text-[#8A93A3] mt-0.5">{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── 3. REAL PLATFORM STATUS / PROTOCOL SPECIFICATIONS ────────────── */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-b border-[#E2E4EE] bg-[#F1F2FA]">
        <div className="max-w-6xl mx-auto">
          {hasPopulatedStats ? (
            /* If real numbers are available from backend database, show them */
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <p className="font-display font-bold text-3xl text-[#172033]">
                  {stats.totalGigs.toLocaleString()}
                </p>
                <p className="text-xs uppercase tracking-wider text-[#5F6878] font-semibold mt-1">
                  Active Gigs
                </p>
              </div>
              <div>
                <p className="font-display font-bold text-3xl text-[#176B4A]">
                  {stats.totalVolume} ETH
                </p>
                <p className="text-xs uppercase tracking-wider text-[#5F6878] font-semibold mt-1">
                  Settled Volume
                </p>
              </div>
              <div>
                <p className="font-display font-bold text-3xl text-[#172033]">
                  {stats.totalUsers.toLocaleString()}
                </p>
                <p className="text-xs uppercase tracking-wider text-[#5F6878] font-semibold mt-1">
                  Registered Wallets
                </p>
              </div>
              <div>
                <p className="font-display font-bold text-3xl text-[#176B4A]">
                  {stats.totalBadges.toLocaleString()}
                </p>
                <p className="text-xs uppercase tracking-wider text-[#5F6878] font-semibold mt-1">
                  Badges Minted
                </p>
              </div>
            </div>
          ) : (
            /* Honest, real protocol specifications when DB stats are zero or unpopulated */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {protocolSpecs.map(({ label, value, desc, icon: Icon }) => (
                <div
                  key={label}
                  className="rounded-xl border border-[#E2E4EE] bg-white p-5 flex flex-col justify-between shadow-xs"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-[#8A93A3] uppercase tracking-wider font-semibold">
                      {label}
                    </span>
                    <Icon className="w-4 h-4 text-[#176B4A]" />
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-[#172033] font-display">
                      {value}
                    </p>
                    <p className="text-xs text-[#5F6878] mt-1 leading-relaxed">
                      {desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── 4. HOW IT WORKS ──────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b border-[#E2E4EE]" id="how-it-works">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#176B4A] mb-2 font-mono">
              Workflow
            </h2>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-[#172033]">
              How GigChain Operates
            </h3>
            <p className="text-sm text-[#5F6878] max-w-xl mx-auto mt-3">
              A transparent, milestone-gated contract from initiation to settlement.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {howItWorksSteps.map(({ step, title, desc }) => (
              <div
                key={step}
                className="rounded-xl border border-[#E2E4EE] bg-white p-6 flex gap-4 transition-all hover:border-[#CBD2DE] shadow-xs"
              >
                <div className="text-2xl font-mono font-bold text-[#176B4A] shrink-0 w-10">
                  {step}
                </div>
                <div>
                  <h4 className="text-base font-semibold text-[#172033] mb-2">
                    {title}
                  </h4>
                  <p className="text-sm text-[#5F6878] leading-relaxed">
                    {desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 5. ESCROW ARCHITECTURE SECTION ───────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b border-[#E2E4EE] bg-[#F1F2FA]">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#E8F5EE] border border-[#23895A]/30 text-xs font-semibold text-[#176B4A] mb-4">
                <Lock className="w-3.5 h-3.5 text-[#176B4A]" />
                <span>Non-Custodial Architecture</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-display font-bold text-[#172033] mb-4 leading-snug">
                Why Smart Contract Escrow Matters
              </h3>
              <p className="text-sm text-[#5F6878] mb-5 leading-relaxed">
                Traditional platforms hold your money in corporate bank accounts,
                dictating holding periods and charging up to 20% in fees.
              </p>
              <p className="text-sm text-[#5F6878] mb-6 leading-relaxed">
                With GigChain, funds are locked inside the verified{" "}
                <code className="px-1.5 py-0.5 rounded bg-[#E2E4EE] text-[#172033] text-xs font-mono font-semibold">
                  GigEscrow
                </code>{" "}
                contract on Ethereum Sepolia. Funds can only be released upon
                client milestone sign-off or formal arbitration settlement.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#176B4A] mt-0.5 shrink-0" />
                  <span className="text-xs text-[#172033]">
                    Zero corporate custody — neither party nor GigChain can unilaterally seize locked capital.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#176B4A] mt-0.5 shrink-0" />
                  <span className="text-xs text-[#172033]">
                    Transparent on-chain accounting verifiable on block explorers.
                  </span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#176B4A] mt-0.5 shrink-0" />
                  <span className="text-xs text-[#172033]">
                    Deterministic execution governed purely by smart contract logic.
                  </span>
                </div>
              </div>
            </div>

            {/* Architecture Graphic */}
            <div className="rounded-xl border border-[#E2E4EE] bg-white p-6 shadow-xs">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#5F6878] mb-4 pb-2 border-b border-[#E2E4EE]">
                Custody Comparison
              </div>

              {/* Traditional model */}
              <div className="mb-5 rounded-lg bg-red-50/50 p-4 border border-red-200">
                <div className="text-xs font-semibold text-red-900 mb-2">
                  Traditional Freelance Platform
                </div>
                <div className="flex items-center justify-between text-xs text-[#5F6878] font-mono">
                  <span>Client</span>
                  <span>→</span>
                  <span className="text-red-700 bg-red-100 px-2 py-0.5 rounded border border-red-200 font-semibold">
                    Platform Bank Account
                  </span>
                  <span>→</span>
                  <span>Freelancer</span>
                </div>
                <p className="text-[11px] text-red-700 mt-2">
                  Platform holds funds, takes 20%, delays releases.
                </p>
              </div>

              {/* GigChain model */}
              <div className="rounded-lg bg-[#E8F5EE] p-4 border border-[#23895A]/30">
                <div className="text-xs font-semibold text-[#176B4A] mb-2">
                  GigChain Non-Custodial Model
                </div>
                <div className="flex items-center justify-between text-xs text-[#172033] font-mono">
                  <span>Client</span>
                  <span>→</span>
                  <span className="text-[#176B4A] bg-white px-2 py-0.5 rounded border border-[#23895A]/40 font-bold">
                    GigEscrow Smart Contract
                  </span>
                  <span>→</span>
                  <span>Freelancer</span>
                </div>
                <p className="text-[11px] text-[#13583C] mt-2 font-medium">
                  Zero middleman custody. Released instantly upon client milestone approval.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 6. MILESTONE PROGRESSION SECTION ─────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b border-[#E2E4EE]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#176B4A] mb-2 font-mono">
              Milestone Lifecycle
            </h2>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-[#172033]">
              Structured Deliverables, Zero Ambiguity
            </h3>
            <p className="text-sm text-[#5F6878] max-w-xl mx-auto mt-3">
              Contracts are divided into explicit milestones. Payment releases incrementally as work passes review.
            </p>
          </div>

          {/* Milestone timeline demonstration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-[#E2E4EE] bg-white p-5 shadow-xs">
              <div className="text-xs font-mono font-semibold text-[#8A93A3] mb-1">STAGE 1</div>
              <div className="text-sm font-semibold text-[#172033] mb-2">
                Milestone: Defined
              </div>
              <p className="text-xs text-[#5F6878] leading-relaxed">
                Deliverable requirements, acceptance criteria, and specific budget allocation are locked into the contract.
              </p>
              <div className="mt-4 text-[11px] font-semibold text-[#5F6878] bg-[#F1F2FA] px-2 py-1 rounded inline-block">
                Status: Scheduled
              </div>
            </div>

            <div className="rounded-xl border border-[#E2E4EE] bg-white p-5 shadow-xs">
              <div className="text-xs font-mono font-semibold text-[#176B4A] mb-1">STAGE 2</div>
              <div className="text-sm font-semibold text-[#172033] mb-2">
                Milestone: In Progress
              </div>
              <p className="text-xs text-[#5F6878] leading-relaxed">
                Freelancer initiates active development. Escrow funds for this milestone are fully deposited and secured.
              </p>
              <div className="mt-4 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-1 rounded inline-block">
                Status: In Progress
              </div>
            </div>

            <div className="rounded-xl border border-[#E2E4EE] bg-white p-5 shadow-xs">
              <div className="text-xs font-mono font-semibold text-[#7567C7] mb-1">STAGE 3</div>
              <div className="text-sm font-semibold text-[#172033] mb-2">
                Milestone: Submitted
              </div>
              <p className="text-xs text-[#5F6878] leading-relaxed">
                Deliverable artifacts are uploaded to IPFS. The cryptographic CID is recorded on-chain for client review.
              </p>
              <div className="mt-4 text-[11px] font-semibold text-[#7567C7] bg-[#EEEAFB] border border-[#DDD6F7] px-2 py-1 rounded inline-block">
                Status: In Review
              </div>
            </div>

            <div className="rounded-xl border border-[#23895A]/30 bg-[#E8F5EE] p-5 shadow-xs">
              <div className="text-xs font-mono font-semibold text-[#176B4A] mb-1">STAGE 4</div>
              <div className="text-sm font-semibold text-[#176B4A] mb-2">
                Milestone: Released
              </div>
              <p className="text-xs text-[#13583C] leading-relaxed">
                Client signs approval. The smart contract releases the milestone payout directly to the freelancer's wallet.
              </p>
              <div className="mt-4 text-[11px] font-semibold text-[#176B4A] bg-white border border-[#23895A]/30 px-2 py-1 rounded inline-block">
                Status: Settled
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 7. TRUST / ON-CHAIN REPUTATION SECTION ───────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b border-[#E2E4EE] bg-[#F1F2FA]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#176B4A] mb-2 font-mono">
              Reputation
            </h2>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-[#172033]">
              Permanent, On-Chain Track Record
            </h3>
            <p className="text-sm text-[#5F6878] max-w-xl mx-auto mt-3">
              No platform-locked ratings that disappear if you close an account.
              Every completed contract mints verifiable ERC-721 reputation badges.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {badgeHighlights.map(({ type, name, emoji, desc }) => (
              <div
                key={type}
                className="rounded-xl border border-[#E2E4EE] bg-white p-5 flex flex-col justify-between shadow-xs"
              >
                <div>
                  <div className="text-2xl mb-3">{emoji}</div>
                  <h4 className="text-sm font-semibold text-[#172033] mb-1">
                    {name}
                  </h4>
                  <p className="text-xs text-[#5F6878] leading-relaxed">
                    {desc}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#E2E4EE] flex items-center justify-between text-[11px] text-[#8A93A3] font-medium">
                  <span>5 Tier Levels</span>
                  <span className="text-[#176B4A] font-semibold">Bronze → Diamond</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              to="/reputation"
              className="inline-flex items-center gap-2 text-xs font-semibold text-[#176B4A] hover:text-[#13583C] transition-colors"
            >
              <span>Explore On-Chain Reputation System</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 8. TRANSPARENT DISPUTE RESOLUTION SECTION ────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b border-[#E2E4EE]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#E8F5EE] border border-[#23895A]/30 text-xs font-semibold text-[#176B4A] mb-3">
              <Scale className="w-3.5 h-3.5 text-[#176B4A]" />
              <span>Dispute Protocol</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-[#172033]">
              Transparent, Evidence-Based Arbitration
            </h3>
            <p className="text-sm text-[#5F6878] max-w-xl mx-auto mt-3">
              When deliverables are contested, disputes follow a structured,
              transparent procedure rather than opaque corporate decrees.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-[#E2E4EE] bg-white p-5 shadow-xs">
              <span className="text-xs font-mono font-semibold text-[#8A93A3]">STAGE 1</span>
              <h4 className="text-sm font-semibold text-[#172033] mt-2 mb-2">
                Issue Raised
              </h4>
              <p className="text-xs text-[#5F6878] leading-relaxed">
                Either client or freelancer flags an impasse with a documented explanation.
              </p>
            </div>

            <div className="rounded-xl border border-[#E2E4EE] bg-white p-5 shadow-xs">
              <span className="text-xs font-mono font-semibold text-[#8A93A3]">STAGE 2</span>
              <h4 className="text-sm font-semibold text-[#172033] mt-2 mb-2">
                Evidence Logged
              </h4>
              <p className="text-xs text-[#5F6878] leading-relaxed">
                Both parties submit statements and deliverables with permanent IPFS hashes.
              </p>
            </div>

            <div className="rounded-xl border border-[#E2E4EE] bg-white p-5 shadow-xs">
              <span className="text-xs font-mono font-semibold text-[#176B4A]">STAGE 3</span>
              <h4 className="text-sm font-semibold text-[#172033] mt-2 mb-2">
                AI Assessment
              </h4>
              <p className="text-xs text-[#5F6878] leading-relaxed">
                Objective analysis compares deliverables against stated milestone criteria.
              </p>
            </div>

            <div className="rounded-xl border border-[#E2E4EE] bg-white p-5 shadow-xs">
              <span className="text-xs font-mono font-semibold text-[#176B4A]">STAGE 4</span>
              <h4 className="text-sm font-semibold text-[#172033] mt-2 mb-2">
                Arbitrator Verdict
              </h4>
              <p className="text-xs text-[#5F6878] leading-relaxed">
                Arbitrator reviews all evidence and executes final on-chain fund distribution.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 9. FEATURE-BY-FEATURE COMPARISON MATRIX ──────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b border-[#E2E4EE] bg-[#F1F2FA]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#176B4A] mb-2 font-mono">
              Comparison
            </h2>
            <h3 className="text-2xl sm:text-3xl font-display font-bold text-[#172033]">
              Traditional Marketplaces vs. GigChain
            </h3>
            <p className="text-sm text-[#5F6878] max-w-xl mx-auto mt-3">
              Objective operational differences between legacy freelance intermediaries and GigChain escrow.
            </p>
          </div>

          <div className="rounded-xl border border-[#E2E4EE] bg-white overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#E2E4EE] bg-[#F8F8FC] text-xs font-semibold text-[#5F6878] uppercase font-mono">
                    <th className="py-3.5 px-5">Capability</th>
                    <th className="py-3.5 px-5 text-[#5F6878]">Traditional Platforms</th>
                    <th className="py-3.5 px-5 text-[#176B4A]">GigChain Protocol</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E4EE]">
                  {comparisonRows.map(({ feature, traditional, gigchain, highlight }) => (
                    <tr key={feature} className="hover:bg-[#F8F8FC] transition-colors">
                      <td className="py-4 px-5 font-semibold text-[#172033] text-xs sm:text-sm">
                        {feature}
                      </td>
                      <td className="py-4 px-5 text-[#5F6878] text-xs sm:text-sm">
                        {traditional}
                      </td>
                      <td className={`py-4 px-5 text-xs sm:text-sm font-semibold ${highlight ? "text-[#176B4A]" : "text-[#172033]"}`}>
                        {gigchain}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 10. FINAL CTA ────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-b border-[#E2E4EE]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-[#172033] mb-4">
            Work with confidence.
          </h2>
          <p className="text-base text-[#5F6878] max-w-xl mx-auto mb-8 leading-relaxed">
            Find work, hire talent, and manage milestone escrow through one
            transparent, non-custodial freelance workflow.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/browse"
              id="final-browse-btn"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg bg-[#176B4A] hover:bg-[#13583C] text-white font-medium text-sm transition-colors shadow-xs"
            >
              <span>Browse Open Gigs</span>
              <ArrowRight className="w-4 h-4 text-emerald-200" />
            </Link>

            <Link
              to="/post-gig"
              id="final-post-btn"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg border border-[#E2E4EE] hover:border-[#CBD2DE] bg-white text-[#172033] hover:bg-[#F1F2FA] font-medium text-sm transition-colors shadow-xs"
            >
              <span>Post a Gig</span>
              <ChevronRight className="w-4 h-4 text-[#8A93A3]" />
            </Link>
          </div>

          <p className="text-xs text-[#8A93A3] mt-6 flex items-center justify-center gap-1.5 font-medium">
            <span>Deployed on Ethereum Sepolia</span>
            <span>·</span>
            <a
              href="https://sepolia.etherscan.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#176B4A] hover:text-[#13583C] inline-flex items-center gap-1 font-semibold"
            >
              <span>Explorer</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </div>
      </section>

      {/* ─── 11. MINIMAL HONEST FOOTER ────────────────────────────────────── */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-white border-t border-[#E2E4EE]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 pb-8 border-b border-[#E2E4EE]">
            <div>
              <div className="mb-2">
                <GigChainLogo variant="horizontal" size="sm" theme="light" />
              </div>
              <p className="text-xs text-[#5F6878] max-w-sm">
                Trustless freelance escrow protocol powered by smart contracts and milestone settlement.
              </p>
            </div>

            {/* Real internal links only */}
            <div className="flex flex-wrap gap-6 sm:gap-8 text-xs text-[#5F6878]">
              <Link to="/browse" className="hover:text-[#172033] transition-colors font-medium">
                Browse Gigs
              </Link>
              <Link to="/post-gig" className="hover:text-[#172033] transition-colors font-medium">
                Post a Gig
              </Link>
              <Link to="/my-contracts" className="hover:text-[#172033] transition-colors font-medium">
                Dashboard
              </Link>
              <Link to="/reputation" className="hover:text-[#172033] transition-colors font-medium">
                Reputation
              </Link>
              <Link to="/profile" className="hover:text-[#172033] transition-colors font-medium">
                Profile
              </Link>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8A93A3]">
            <p>© 2026 GigChain. Built for Hackblox / SIH 2026.</p>
            <div className="flex items-center gap-4 text-[#8A93A3]">
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
