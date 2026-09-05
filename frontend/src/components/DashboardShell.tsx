import { useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Search,
  Plus,
  Award,
  User,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { useWallet } from "../context/WalletContext";
import GigChainLogo from "./GigChainLogo";
import { shortenAddress } from "../lib/types";
import { CHAIN_NAMES, SUPPORTED_CHAIN_IDS } from "../lib/contracts";
import clsx from "clsx";

interface DashboardShellProps {
  children: ReactNode;
  activeTab?: string;
}

export default function DashboardShell({ children }: DashboardShellProps) {
  const {
    address,
    isConnected,
    isAuthenticated,
    profile,
    loadingProfile,
    chainId,
    disconnect,
    switchAccount,
  } = useWallet();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const navItems = [
    {
      to: "/my-contracts",
      aliases: ["/dashboard", "/my-contracts"],
      label: "Overview",
      icon: LayoutDashboard,
    },
    {
      to: "/browse",
      aliases: ["/browse"],
      label: "Browse Gigs",
      icon: Search,
    },
    {
      to: "/post-gig",
      aliases: ["/post-gig"],
      label: "Post a Gig",
      icon: Plus,
    },
    {
      to: "/reputation",
      aliases: ["/reputation"],
      label: "Reputation",
      icon: Award,
    },
    {
      to: "/profile",
      aliases: ["/profile"],
      label: "Profile",
      icon: User,
    },
  ];

  const handleDisconnect = () => {
    disconnect();
    navigate("/");
  };

  const handleSwitchAccount = async () => {
    await switchAccount();
    const token = localStorage.getItem("gigchain_jwt");
    const authAddress = localStorage.getItem("gigchain_auth_address");
    if (!token || !authAddress) {
      navigate("/auth");
    }
  };

  const isUnsupportedChain =
    chainId !== null && !SUPPORTED_CHAIN_IDS.includes(chainId);
  const chainName = chainId
    ? CHAIN_NAMES[chainId] || `Chain ${chainId}`
    : "Sepolia Testnet";

  const hasDisplayName = profile?.displayName && profile.displayName.trim().length > 0;
  const isSessionAuthenticated = isAuthenticated;

  return (
    <div className="min-h-screen bg-[#F8F8FC] text-[#172033] flex flex-col md:flex-row">
      {/* ─── MOBILE TOP BAR ──────────────────────────────────────────────── */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-[#E2E4EE] sticky top-0 z-40">
        <Link to="/" aria-label="GigChain Home">
          <GigChainLogo variant="horizontal" size="sm" theme="light" />
        </Link>
        <button
          onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
          className="p-2 text-[#5F6878] hover:text-[#172033]"
          aria-label="Toggle navigation menu"
        >
          {mobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* ─── VERTICAL SIDEBAR (DESKTOP + MOBILE DRAWER) ───────────────────── */}
      <aside
        className={clsx(
          "w-64 bg-white border-r border-[#E2E4EE] flex flex-col justify-between shrink-0 transition-all duration-200 z-50",
          "md:sticky md:top-0 md:h-screen",
          mobileSidebarOpen
            ? "fixed inset-y-0 left-0 flex shadow-2xl"
            : "hidden md:flex"
        )}
      >
        {/* Sidebar Top: Logo + Nav Items */}
        <div className="p-5 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <Link to="/" className="inline-block" aria-label="GigChain Home">
              <GigChainLogo variant="horizontal" size="sm" theme="light" />
            </Link>
            {mobileSidebarOpen && (
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="md:hidden p-1 text-[#8A93A3] hover:text-[#172033]"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8A93A3] px-3">
            Navigation
          </div>

          <nav className="flex flex-col gap-1">
            {navItems.map(({ to, aliases, label, icon: Icon }) => {
              const isActive = aliases.some((a) => location.pathname.startsWith(a));
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMobileSidebarOpen(false)}
                  className={clsx(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[#E8F5EE] text-[#176B4A] border border-[#23895A]/30 font-semibold"
                      : "text-[#5F6878] hover:text-[#172033] hover:bg-[#F1F2FA]"
                  )}
                >
                  <Icon
                    className={clsx(
                      "w-4 h-4",
                      isActive ? "text-[#176B4A]" : "text-[#8A93A3]"
                    )}
                  />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Bottom: Connected Wallet Info & Actions */}
        <div className="p-4 border-t border-[#E2E4EE] bg-[#F1F2FA]/70 flex flex-col gap-3">
          {/* Network indicator */}
          <div className="flex items-center justify-between px-2 text-xs">
            <div className="flex items-center gap-1.5 text-[#5F6878]">
              <span
                className={clsx(
                  "w-2 h-2 rounded-full",
                  isUnsupportedChain ? "bg-red-500" : "bg-[#23895A]"
                )}
              />
              <span className="font-mono text-[11px] text-[#172033] font-medium">{chainName}</span>
            </div>
            <a
              href="https://sepolia.etherscan.io"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#8A93A3] hover:text-[#176B4A]"
              title="View on Etherscan"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Authenticated Wallet / Switch Account / Disconnect */}
          {isConnected && address ? (
            <div className="flex flex-col gap-2 p-2.5 rounded-lg bg-white border border-[#E2E4EE] shadow-xs">
              <div className="flex items-center justify-between">
                <div className="overflow-hidden">
                  <div className="text-[10px] font-semibold uppercase text-[#8A93A3]">
                    Connected
                  </div>
                  <div className="font-mono text-xs text-[#172033] font-bold truncate max-w-[130px]" title={address}>
                    {shortenAddress(address, 4)}
                  </div>
                </div>
                <button
                  onClick={handleDisconnect}
                  className="p-1.5 text-[#8A93A3] hover:text-red-600 transition-colors rounded"
                  title="Disconnect Session"
                  aria-label="Disconnect Session"
                  id="dashboard-disconnect-btn"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={handleSwitchAccount}
                id="dashboard-switch-account-btn"
                className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md bg-[#F1F2FA] hover:bg-[#E2E4EE] text-[#172033] text-[11px] font-semibold transition-colors border border-[#E2E4EE]"
                title="Select a different account in MetaMask"
              >
                <RefreshCw className="w-3 h-3 text-[#176B4A]" />
                <span>Switch Account</span>
              </button>
            </div>
          ) : (
            <Link
              to="/auth"
              className="w-full text-center py-2 px-3 rounded-lg bg-[#176B4A] hover:bg-[#13583C] text-white text-xs font-medium transition-colors"
            >
              Connect Wallet
            </Link>
          )}
        </div>
      </aside>

      {/* ─── MAIN CONTENT CONTAINER ──────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Backdrop for mobile drawer */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
    </div>
  );
}
