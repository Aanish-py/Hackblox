import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
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
  const { isAuthenticated } = useWallet();
  const location = useLocation();

  // Show Navbar on public landing, auth, or on browse when unauthenticated
  const showNavbar =
    location.pathname === "/" ||
    location.pathname === "/auth" ||
    (!isAuthenticated && location.pathname === "/browse");

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      <NetworkBanner />
      {showNavbar && <Navbar />}
      <main>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Welcome />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/browse" element={<BrowseContracts />} />

          {/* Protected Routes — Require Real SIWE Authentication */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <MyContracts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-contracts"
            element={
              <ProtectedRoute>
                <MyContracts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gig/:gigId"
            element={
              <ProtectedRoute>
                <MyContracts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/post-gig"
            element={
              <ProtectedRoute>
                <PostGig />
              </ProtectedRoute>
            }
          />
          <Route
            path="/submit-work/:gigId"
            element={
              <ProtectedRoute>
                <SubmitWork />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reputation"
            element={
              <ProtectedRoute>
                <Reputation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reputation/:address"
            element={
              <ProtectedRoute>
                <Reputation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile/:address"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dispute/:gigId"
            element={
              <ProtectedRoute>
                <DisputeDetails />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
