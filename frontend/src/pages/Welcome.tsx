import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Zap, Shield, Award, ArrowRight, ChevronRight, ExternalLink, GitBranch } from "lucide-react";
import { useWallet } from "../context/WalletContext";
import api from "../lib/api";

interface PlatformStats {
  totalGigs: number;
  totalVolume: string;
  totalUsers: number;
  totalBadges: number;
}

const features = [
  {
    icon: Shield,
    title: "Trustless Escrow",
    desc: "Funds locked in smart contract. Released only on your approval. No middleman can touch your money.",
    color: "text-brand-400",
    bg: "bg-brand-500/10 border-brand-500/20",
  },
  {
    icon: GitBranch,
    title: "Milestone Payments",
    desc: "Break projects into 1-10 milestones. Pay per deliverable, not all upfront. Full flexibility.",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/20",
  },
  {
    icon: Award,
    title: "On-Chain Reputation",
    desc: "6 NFT badge types, 5 levels each. Your track record lives on Ethereum — verifiable forever.",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10 border-yellow-500/20",
  },
  {
    icon: Zap,
    title: "Zero Platform Fee",
    desc: "No 5–20% platform cut. Pay only gas. Clients and freelancers keep 100% of the deal.",
    color: "text-green-400",
    bg: "bg-green-500/10 border-green-500/20",
  },
];

const steps = [
  { n: "01", title: "Connect Wallet", desc: "Sign in with MetaMask. No email, no KYC." },
  { n: "02", title: "Post or Browse", desc: "Post a gig with milestones or browse open contracts." },
  { n: "03", title: "Work & Deliver", desc: "Freelancer completes work. Client releases milestone payment." },
  { n: "04", title: "Earn Reputation", desc: "NFT badges auto-mint on completion. Your on-chain resume grows." },
];

const comparison = [
  { feature: "Platform Fee", web2: "5–20%", gigchain: "0% (gas only)" },
  { feature: "Fund Custody", web2: "Platform holds funds", gigchain: "Smart contract" },
  { feature: "Dispute Resolution", web2: "Company employee", gigchain: "Transparent arbitrator + AI" },
  { feature: "Reputation", web2: "Proprietary stars", gigchain: "On-chain NFT badges" },
  { feature: "Payment Options", web2: "Fiat / PayPal", gigchain: "ETH + any ERC-20" },
  { feature: "Job Records", web2: "Platform can delete", gigchain: "IPFS + on-chain, permanent" },
];

export default function Welcome() {
  const { isConnected, connect, isConnecting } = useWallet();
  const [stats, setStats] = useState<PlatformStats | null>(null);

  useEffect(() => {
    api.get("/analytics/stats")
      .then((r) => setStats(r.data))
      .catch(() => setStats(null));
  }, []);

  return (
    <div className="min-h-screen page-enter">
      {/* ─── Hero ─────────────────────────────────────────────────────── */}
      <section className="hero-bg relative pt-20 pb-32 px-4">
        <div className="max-w-5xl mx-auto text-center">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-600/30 bg-brand-600/10 text-brand-300 text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            Live on Ethereum Sepolia Testnet
          </div>

          {/* Headline */}
          <h1 className="heading-xl mb-6">
            Freelance Without <br />
            <span className="gradient-text">Trusting Anyone</span>
          </h1>

          <p className="text-slate-400 text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            GigChain replaces Upwork's 20% fee and black-box disputes with a{" "}
            <span className="text-slate-200">smart contract</span> that enforces
            every rule automatically. Code is the escrow. Code is the judge.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isConnected ? (
              <>
                <Link to="/browse" className="btn-primary text-base px-8 py-3.5" id="hero-browse-btn">
                  Browse Gigs <ArrowRight className="w-5 h-5" />
                </Link>
                <Link to="/post-gig" className="btn-secondary text-base px-8 py-3.5" id="hero-post-btn">
                  Post a Gig <ChevronRight className="w-5 h-5" />
                </Link>
              </>
            ) : (
              <>
                <button
                  onClick={connect}
                  disabled={isConnecting}
                  id="hero-connect-btn"
                  className="btn-primary text-base px-8 py-3.5"
                >
                  {isConnecting ? "Connecting..." : "Connect Wallet to Start"}
                  <ArrowRight className="w-5 h-5" />
                </button>
                <Link to="/browse" className="btn-secondary text-base px-8 py-3.5" id="hero-browse-guest-btn">
                  Browse Gigs <ChevronRight className="w-5 h-5" />
                </Link>
              </>
            )}
          </div>

          {/* Platform stats */}
          {stats && (
            <div className="flex flex-wrap justify-center gap-8 mt-16 pt-8 border-t border-space-600">
              {[
                { label: "Total Gigs", value: stats.totalGigs.toLocaleString() },
                { label: "Volume (ETH)", value: stats.totalVolume },
                { label: "Active Users", value: stats.totalUsers.toLocaleString() },
                { label: "Badges Minted", value: stats.totalBadges.toLocaleString() },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <p className="font-display font-bold text-2xl gradient-text">{value}</p>
                  <p className="text-slate-500 text-sm">{label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── Features ─────────────────────────────────────────────────── */}
      <section className="py-20 px-4" id="features">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="heading-lg mb-3">Built Different</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Every feature is enforced by on-chain code — not a company policy.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, desc, color, bg }) => (
              <div key={title} className="glass-card p-6 flex flex-col gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${bg}`}>
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <div>
                  <h3 className="heading-md mb-2">{title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─────────────────────────────────────────────── */}
      <section className="py-20 px-4 bg-gradient-to-b from-transparent to-space-800/50" id="how-it-works">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="heading-lg mb-3">How It Works</h2>
            <p className="text-slate-400">Four steps from wallet connect to earning on-chain reputation.</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {steps.map(({ n, title, desc }) => (
              <div key={n} className="glass-card p-6 flex gap-5">
                <div className="font-display font-bold text-4xl gradient-text opacity-50 shrink-0 w-14">{n}</div>
                <div>
                  <h3 className="heading-md mb-1.5">{title}</h3>
                  <p className="text-slate-400 text-sm">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Comparison Table ─────────────────────────────────────────── */}
      <section className="py-20 px-4" id="comparison">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="heading-lg mb-3">Why Not Upwork?</h2>
            <p className="text-slate-400">Feature-by-feature comparison.</p>
          </div>
          <div className="glass-card overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="py-4">Feature</th>
                  <th className="py-4 text-slate-500">Upwork / Fiverr</th>
                  <th className="py-4">
                    <span className="gradient-text">GigChain</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparison.map(({ feature, web2, gigchain }) => (
                  <tr key={feature}>
                    <td className="font-medium text-white">{feature}</td>
                    <td className="text-slate-500 text-sm">{web2}</td>
                    <td className="text-green-400 text-sm font-medium">{gigchain}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ─── Final CTA ────────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="glass-card p-10 animated-border">
            <h2 className="heading-lg mb-4">
              Ready to <span className="gradient-text">build on-chain?</span>
            </h2>
            <p className="text-slate-400 mb-8">
              Connect your wallet and start your first trustless gig in under a minute.
            </p>
            {isConnected ? (
              <Link to="/post-gig" className="btn-primary text-base px-8 py-3.5" id="final-cta-btn">
                Post Your First Gig <ArrowRight className="w-5 h-5" />
              </Link>
            ) : (
              <button onClick={connect} disabled={isConnecting} id="final-connect-btn" className="btn-primary text-base px-8 py-3.5">
                {isConnecting ? "Connecting..." : "Connect Wallet"} <ArrowRight className="w-5 h-5" />
              </button>
            )}
            <p className="text-slate-600 text-xs mt-4">
              Deployed on Ethereum Sepolia ·{" "}
              <a
                href="https://sepolia.etherscan.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-500 hover:text-brand-400 inline-flex items-center gap-1"
              >
                View on Etherscan <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
