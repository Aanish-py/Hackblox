import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import Welcome from "./pages/Welcome";
import Auth from "./pages/Auth";
import PostGig from "./pages/PostGig";
import BrowseContracts from "./pages/BrowseContracts";
import MyContracts from "./pages/MyContracts";
import SubmitWork from "./pages/SubmitWork";
import Reputation from "./pages/Reputation";
import Profile from "./pages/Profile";
import DisputeDetails from "./pages/DisputeDetails";
import { useWallet } from "./context/WalletContext";
import { CHAIN_ID, CHAIN_NAMES } from "./lib/contracts";

function NetworkBanner() {
  const { isConnected, chainId, switchToSepolia } = useWallet();

  if (!isConnected || !chainId || chainId === CHAIN_ID) return null;

  const currentChainName = CHAIN_NAMES[chainId] || `Chain ${chainId}`;

  return (
    <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-center text-xs sm:text-sm flex flex-wrap items-center justify-center gap-3">
      <span>
        ⚠️ <strong>Network Mismatch:</strong> Connected to <strong>{currentChainName}</strong>. Please switch to <strong>Sepolia Testnet</strong>.
      </span>
      <button
        onClick={switchToSepolia}
        className="px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-md text-xs font-semibold transition-colors"
      >
        Switch to Sepolia Testnet
      </button>
    </div>
  );
}

export default function App() {
  const location = useLocation();
  const isPublicRoute =
    location.pathname === "/" ||
    location.pathname === "/auth";

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <NetworkBanner />
      {isPublicRoute && <Navbar />}
      <main>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<MyContracts />} />
          <Route path="/my-contracts" element={<MyContracts />} />
          <Route path="/gig/:gigId" element={<MyContracts />} />
          <Route path="/browse" element={<BrowseContracts />} />
          <Route path="/post-gig" element={<PostGig />} />
          <Route path="/submit-work/:gigId" element={<SubmitWork />} />
          <Route path="/reputation" element={<Reputation />} />
          <Route path="/reputation/:address" element={<Reputation />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:address" element={<Profile />} />
          <Route path="/dispute/:gigId" element={<DisputeDetails />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
