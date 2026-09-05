import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Wallet, LogOut, ChevronDown, ExternalLink,
  LayoutDashboard, Plus, Search, Award, User, Menu, X, RefreshCw
} from "lucide-react";
import GigChainLogo from "./GigChainLogo";
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
  const { address, chainId, isConnected, isConnecting, connect, disconnect, switchAccount } = useWallet();
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
    <nav className="sticky top-0 z-50 border-b border-[#E2E4EE] bg-white/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center hover:opacity-85 transition-opacity duration-150"
            aria-label="GigChain Home"
          >
            <GigChainLogo variant="horizontal" size="sm" theme="light" />
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={clsx(
                  "flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                  location.pathname === to
                    ? "bg-[#E8F5EE] text-[#176B4A] border border-[#23895A]/30 font-semibold"
                    : "text-[#5F6878] hover:text-[#172033] hover:bg-[#F1F2FA]"
                )}
              >
                <Icon className={clsx("w-4 h-4", location.pathname === to ? "text-[#176B4A]" : "text-[#8A93A3]")} />
                {label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Chain indicator */}
            {isConnected && chainName && (
              <div className={clsx(
                "hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium",
                isUnsupportedChain
                  ? "bg-red-50 text-red-700 border border-red-200"
                  : "bg-[#E8F5EE] text-[#176B4A] border border-[#23895A]/30"
              )}>
                <div className={clsx("w-1.5 h-1.5 rounded-full", isUnsupportedChain ? "bg-red-500" : "bg-[#23895A] animate-pulse")} />
                {isUnsupportedChain ? "Wrong Network" : chainName}
              </div>
            )}

            {/* Wallet Button */}
            {isConnected ? (
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all duration-150 bg-white border border-[#E2E4EE] text-[#172033] hover:bg-[#F1F2FA] shadow-sm"
                  id="wallet-dropdown-btn"
                >
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#176B4A] to-[#23895A] flex items-center justify-center text-[10px] text-white font-bold">
                    {address?.slice(2, 4).toUpperCase()}
                  </div>
                  <span className="font-mono text-xs sm:text-sm font-semibold text-[#172033]">{shortenAddress(address!)}</span>
                  <ChevronDown className={clsx("w-3.5 h-3.5 text-[#8A93A3] transition-transform", dropdownOpen && "rotate-180")} />
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[#E2E4EE] bg-white py-2 shadow-lg animate-fade-in z-50">
                    <Link
                      to={`/profile/${address}`}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#5F6878] hover:text-[#172033] hover:bg-[#F1F2FA] transition-colors"
                    >
                      <User className="w-4 h-4 text-[#8A93A3]" />
                      My Profile
                    </Link>
                    <a
                      href={`https://sepolia.etherscan.io/address/${address}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#5F6878] hover:text-[#172033] hover:bg-[#F1F2FA] transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 text-[#8A93A3]" />
                      View on Etherscan
                    </a>
                    <button
                      onClick={async () => {
                        setDropdownOpen(false);
                        await switchAccount();
                        const token = localStorage.getItem("gigchain_jwt");
                        const authAddress = localStorage.getItem("gigchain_auth_address");
                        if (!token || !authAddress) {
                          navigate("/auth");
                        }
                      }}
                      id="navbar-switch-account-btn"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#172033] hover:bg-[#F1F2FA] transition-colors w-full text-left font-medium"
                    >
                      <RefreshCw className="w-4 h-4 text-[#176B4A]" />
                      Switch Account
                    </button>
                    <div className="my-1 border-t border-[#E2E4EE]" />
                    <button
                      onClick={handleDisconnect}
                      id="disconnect-wallet-btn"
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 transition-colors w-full text-left font-medium"
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
                className="btn-primary text-sm py-2 px-4"
              >
                <Wallet className="w-4 h-4" />
                {isConnecting ? "Connecting..." : "Connect Wallet"}
              </button>
            )}

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 text-[#5F6878] hover:text-[#172033] transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-[#E2E4EE] pt-3 animate-fade-in">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={clsx(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium mb-1 transition-all",
                  location.pathname === to
                    ? "bg-[#E8F5EE] text-[#176B4A] font-semibold"
                    : "text-[#5F6878] hover:text-[#172033] hover:bg-[#F1F2FA]"
                )}
              >
                <Icon className={clsx("w-4 h-4", location.pathname === to ? "text-[#176B4A]" : "text-[#8A93A3]")} />
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
