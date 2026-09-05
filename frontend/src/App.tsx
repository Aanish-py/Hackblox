import { Routes, Route, Navigate } from "react-router-dom";
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
    <div className="bg-amber-500/15 border-b border-amber-500/30 text-amber-200 px-4 py-2 text-center text-xs sm:text-sm flex flex-wrap items-center justify-center gap-3">
      <span>
        ⚠️ <strong>Network Mismatch:</strong> Connected to <strong>{currentChainName}</strong>. Please switch to <strong>Sepolia Testnet</strong>.
      </span>
      <button
        onClick={switchToSepolia}
        className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 rounded-lg text-xs font-semibold transition-colors"
      >
        Switch to Sepolia Testnet
      </button>
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <NetworkBanner />
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/browse" element={<BrowseContracts />} />
          <Route path="/post-gig" element={<PostGig />} />
          <Route path="/my-contracts" element={<MyContracts />} />
          <Route path="/gig/:gigId" element={<MyContracts />} />
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
