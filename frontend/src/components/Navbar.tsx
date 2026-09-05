import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Zap, Wallet, LogOut, ChevronDown, ExternalLink,
  LayoutDashboard, Plus, Search, Award, User, Menu, X
} from "lucide-react";
import { useWallet } from "../context/WalletContext";
import { shortenAddress } from "../lib/types";
import { CHAIN_NAMES, SUPPORTED_CHAIN_IDS } from "../lib/contracts";
import clsx from "clsx";

const navLinks = [
  { to: "/browse", label: "Browse Gigs", icon: Search },
  { to: "/my-contracts", label: "Dashboard", icon: LayoutDashboard },
  { to: "/post-gig", label: "Post Gig", icon: Plus },
  { to: "/reputation", label: "Reputation", icon: Award },
];

export default function Navbar() {
  const { address, chainId, isConnected, isConnecting, connect, disconnect } = useWallet();
  const location = useLocation();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isUnsupportedChain = chainId !== null && !SUPPORTED_CHAIN_IDS.includes(chainId);
  const chainName = chainId ? (CHAIN_NAMES[chainId] || `Chain ${chainId}`) : null;

  const handleDisconnect = () => {
    disconnect();
    setDropdownOpen(false);
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-brand-900/30" style={{ background: "rgba(8,11,20,0.9)", backdropFilter: "blur(20px)" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group" aria-label="GigChain Home">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform"
              style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}>
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-display text-lg font-bold gradient-text">GigChain</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={clsx(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  location.pathname === to
                    ? "bg-brand-600/20 text-brand-300 border border-brand-600/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-space-600"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Chain indicator */}
            {isConnected && chainName && (
              <div className={clsx(
                "hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
                isUnsupportedChain
                  ? "bg-red-500/20 text-red-300 border border-red-500/30"
                  : "bg-green-500/20 text-green-300 border border-green-500/30"
              )}>
                <div className={clsx("w-1.5 h-1.5 rounded-full", isUnsupportedChain ? "bg-red-400" : "bg-green-400 animate-pulse")} />
                {isUnsupportedChain ? "Wrong Network" : chainName}
              </div>
            )}

            {/* Wallet Button */}
            {isConnected ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
                  style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.3)", color: "#c4b5fd" }}
                  id="wallet-dropdown-btn"
                >
                  <div className="w-5 h-5 rounded-full" style={{ background: `linear-gradient(135deg, #7c3aed, #06b6d4)` }} />
                  <span className="font-mono">{shortenAddress(address!)}</span>
                  <ChevronDown className={clsx("w-3 h-3 transition-transform", dropdownOpen && "rotate-180")} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 glass-card py-2 animate-fade-in">
                    <Link
                      to={`/profile/${address}`}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-space-600 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      My Profile
                    </Link>
                    <a
                      href={`https://sepolia.etherscan.io/address/${address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:text-white hover:bg-space-600 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View on Etherscan
                    </a>
                    <div className="my-1 border-t border-space-500" />
                    <button
                      onClick={handleDisconnect}
                      id="disconnect-wallet-btn"
                      className="flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-space-600 transition-colors w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Disconnect
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={connect}
                disabled={isConnecting}
                id="connect-wallet-btn"
                className="btn-primary text-sm py-2"
              >
                <Wallet className="w-4 h-4" />
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </button>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 text-slate-400 hover:text-slate-200 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-space-600 pt-3 animate-fade-in">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={clsx(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium mb-1 transition-all",
                  location.pathname === to
                    ? "bg-brand-600/20 text-brand-300"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Click-outside handler */}
      {dropdownOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
      )}
    </nav>
  );
}
