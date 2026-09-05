import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Shield, Wallet, CheckCircle2, ArrowRight, AlertCircle, Loader2, User, Lock, Key, RefreshCw } from "lucide-react";
import { useWallet } from "../context/WalletContext";
import GigChainLogo from "../components/GigChainLogo";
import { shortenAddress } from "../lib/types";
import api from "../lib/api";

type AuthStep =
  | "DISCONNECTED"
  | "CONNECTED"
  | "WAITING_FOR_SIGNATURE"
  | "AUTHENTICATED"
  | "PROFILE_MISSING"
  | "ERROR";

interface UserProfile {
  address: string;
  displayName: string;
  bio: string;
  avatarUrl?: string;
}

export default function Auth() {
  const { address, signer, isConnected, connect, isConnecting, chainId } = useWallet();
  const [authStep, setAuthStep] = useState<AuthStep>("DISCONNECTED");
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [resolvingProfile, setResolvingProfile] = useState(false);
  const navigate = useNavigate();

  // Inspect existing session on mount or address change
  useEffect(() => {
    if (!isConnected || !address) {
      setAuthStep("DISCONNECTED");
      setProfile(null);
      return;
    }

    const token = localStorage.getItem("gigchain_jwt");
    if (token) {
      resolveUserProfile(address);
    } else {
      setAuthStep("CONNECTED");
    }
  }, [isConnected, address]);

  const resolveUserProfile = async (walletAddr: string) => {
    setResolvingProfile(true);
    try {
      const res = await api.get(`/profile/${walletAddr}`);
      const prof = res.data as UserProfile;
      setProfile(prof);
      if (prof?.displayName && prof.displayName.trim().length > 0) {
        setAuthStep("AUTHENTICATED");
      } else {
        setAuthStep("PROFILE_MISSING");
      }
    } catch {
      // Profile does not exist yet on backend
      setProfile(null);
      setAuthStep("PROFILE_MISSING");
    } finally {
      setResolvingProfile(false);
    }
  };

  const handleSignIn = async () => {
    if (!signer || !address) {
      setError("Wallet provider not detected. Please ensure MetaMask is installed and unlocked.");
      setAuthStep("ERROR");
      return;
    }

    setError(null);
    setAuthStep("WAITING_FOR_SIGNATURE");

    try {
      // 1. Fetch real nonce from backend
      let nonce: string;
      try {
        const nonceRes = await api.get(`/auth/nonce/${address}`);
        nonce = nonceRes.data.nonce;
      } catch (err) {
        throw new Error(
          err instanceof Error
            ? `Backend authentication service unavailable: ${err.message}`
            : "Backend authentication service unavailable."
        );
      }

      // 2. Construct Sign-In with Ethereum (SIWE) message
      const network = await signer.provider.getNetwork();
      const message = [
        "GigChain wants you to sign in with your Ethereum account:",
        address,
        "",
        "Sign in to GigChain — Trustless Freelance Escrow",
        "",
        `URI: ${window.location.origin}`,
        "Version: 1",
        `Chain ID: ${network.chainId}`,
        `Nonce: ${nonce}`,
        `Issued At: ${new Date().toISOString()}`,
      ].join("\n");

      // 3. Request cryptographic signature in MetaMask
      const signature = await signer.signMessage(message);

      // 4. Verify signature on backend and receive session token
      const verifyRes = await api.post("/auth/verify", { address, message, signature });
      const { token } = verifyRes.data;

      localStorage.setItem("gigchain_jwt", token);

      // 5. Query real profile identity
      await resolveUserProfile(address);
    } catch (err) {
      const rawMsg = err instanceof Error ? err.message : "Authentication signature failed.";
      let friendlyError = rawMsg;

      if (rawMsg.toLowerCase().includes("rejected") || rawMsg.toLowerCase().includes("denied")) {
        friendlyError = "Signature request was rejected in MetaMask. Please approve the signature to authenticate.";
      } else if (rawMsg.toLowerCase().includes("network") || rawMsg.toLowerCase().includes("chain")) {
        friendlyError = "Network communication error. Please ensure MetaMask is connected to Sepolia Testnet.";
      }

      setError(friendlyError);
      setAuthStep("ERROR");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8FC] text-[#172033] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Link to="/" aria-label="GigChain Home">
              <GigChainLogo variant="horizontal" size="md" theme="light" />
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#172033] tracking-tight mb-2">
            Enter your workspace.
          </h1>
          <p className="text-xs sm:text-sm text-[#5F6878] max-w-sm mx-auto leading-relaxed">
            Wallet-based cryptographic authentication is used to access your GigChain workspace.
          </p>
        </div>

        {/* Authentication Card */}
        <div className="rounded-xl border border-[#E2E4EE] bg-white p-6 sm:p-8 shadow-xs">
          {/* STATE: DISCONNECTED */}
          {!isConnected && (
            <div className="text-center space-y-5">
              <div className="w-12 h-12 rounded-xl bg-[#E8F5EE] border border-[#23895A]/30 flex items-center justify-center mx-auto text-[#176B4A]">
                <Wallet className="w-6 h-6" />
              </div>

              <div>
                <h2 className="text-base font-bold text-[#172033]">
                  Connect MetaMask
                </h2>
                <p className="text-xs text-[#5F6878] mt-1 leading-relaxed">
                  Connect your Web3 wallet to verify ownership, review your contracts, and manage escrow releases.
                </p>
              </div>

              <button
                onClick={connect}
                disabled={isConnecting}
                id="auth-connect-btn"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-lg bg-[#176B4A] hover:bg-[#13583C] text-white text-xs font-semibold transition-colors shadow-xs disabled:opacity-50"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting MetaMask...</span>
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4" />
                    <span>Connect MetaMask</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* STATE: CONNECTED (Wallet ready, awaiting SIWE action) */}
          {isConnected && authStep === "CONNECTED" && (
            <div className="space-y-5">
              <div className="p-3.5 rounded-lg bg-[#F8F8FC] border border-[#E2E4EE] flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-semibold uppercase text-[#8A93A3] block">
                    Connected Wallet
                  </span>
                  <p className="font-mono text-xs text-[#172033] font-bold" title={address || ""}>
                    {shortenAddress(address || "", 6)}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#E8F5EE] text-[#176B4A] border border-[#23895A]/30">
                  Ready to Sign
                </span>
              </div>

              <div className="space-y-2.5">
                {[
                  "MetaMask will present a standard challenge to sign.",
                  "Zero gas fee, zero blockchain transaction, no funds moved.",
                  "Cryptographic proof issues a secure, non-custodial session.",
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-[#5F6878]">
                    <span className="w-4 h-4 rounded-full bg-[#E8F5EE] text-[#176B4A] font-mono flex items-center justify-center text-[10px] shrink-0 mt-0.5 border border-[#23895A]/30 font-semibold">
                      {i + 1}
                    </span>
                    <span className="leading-tight">{step}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleSignIn}
                id="siwe-sign-btn"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-lg bg-[#176B4A] hover:bg-[#13583C] text-white text-xs font-semibold transition-colors shadow-xs"
              >
                <Shield className="w-4 h-4" />
                <span>Sign in with Ethereum</span>
              </button>
            </div>
          )}

          {/* STATE: WAITING FOR SIGNATURE */}
          {isConnected && authStep === "WAITING_FOR_SIGNATURE" && (
            <div className="text-center space-y-4 py-4">
              <div className="w-12 h-12 rounded-xl bg-[#E8F5EE] border border-[#23895A]/30 flex items-center justify-center mx-auto text-[#176B4A]">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#172033]">
                  Waiting for MetaMask signature...
                </h2>
                <p className="text-xs text-[#5F6878] mt-1">
                  Please open your MetaMask extension and sign the challenge to verify ownership of <span className="font-mono text-[#172033]">{shortenAddress(address || "", 4)}</span>.
                </p>
              </div>
              <p className="text-[11px] text-[#8A93A3] italic">
                Authenticating wallet...
              </p>
            </div>
          )}

          {/* STATE: AUTHENTICATED (Real displayName confirmed) */}
          {isConnected && authStep === "AUTHENTICATED" && (
            <div className="text-center space-y-5 py-2">
              <div className="w-12 h-12 rounded-xl bg-[#E8F5EE] border border-[#23895A]/30 flex items-center justify-center mx-auto text-[#176B4A]">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div>
                <h2 className="text-base font-bold text-[#172033]">
                  Authentication successful
                </h2>
                <p className="text-xs text-[#5F6878] mt-1">
                  Welcome back, <strong className="text-[#172033]">{profile?.displayName}</strong>
                </p>
              </div>

              <div className="p-3 rounded-lg bg-[#F8F8FC] border border-[#E2E4EE] text-left text-xs font-mono text-[#5F6878]">
                <span className="text-[10px] text-[#8A93A3] block uppercase font-semibold mb-0.5">Verified Identity</span>
                <span className="text-[#172033] font-bold">{shortenAddress(address || "", 6)}</span>
              </div>

              <button
                onClick={() => navigate("/my-contracts")}
                id="auth-continue-btn"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-lg bg-[#176B4A] hover:bg-[#13583C] text-white text-xs font-semibold transition-colors shadow-xs"
              >
                <span>Continue to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STATE: PROFILE MISSING (Authenticated, but no displayName) */}
          {isConnected && authStep === "PROFILE_MISSING" && (
            <div className="space-y-5 py-2">
              <div className="text-center">
                <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-700 mb-3">
                  <User className="w-6 h-6" />
                </div>
                <h2 className="text-base font-bold text-[#172033]">
                  Authentication successful
                </h2>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold mt-2">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>Profile setup required</span>
                </div>
                <p className="text-xs text-[#5F6878] mt-2 leading-relaxed">
                  Your wallet address <strong className="font-mono text-[#172033]">{shortenAddress(address || "", 4)}</strong> is authenticated. Set up your display name and skills so clients can collaborate with you.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => navigate("/profile")}
                  id="auth-setup-profile-btn"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#176B4A] hover:bg-[#13583C] text-white text-xs font-semibold transition-colors shadow-xs"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Set Up Profile Now</span>
                </button>
                <button
                  onClick={() => navigate("/my-contracts")}
                  id="auth-skip-to-dashboard-btn"
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-white hover:bg-[#F1F2FA] text-[#5F6878] hover:text-[#172033] border border-[#E2E4EE] text-xs font-medium transition-colors"
                >
                  <span>Skip to Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* STATE: ERROR */}
          {authStep === "ERROR" && (
            <div className="space-y-5">
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
                <div>
                  <p className="font-bold text-red-900">Authentication Failed</p>
                  <p className="text-red-700 mt-0.5 leading-relaxed">{error}</p>
                </div>
              </div>

              <button
                onClick={handleSignIn}
                id="auth-retry-btn"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-lg bg-[#176B4A] hover:bg-[#13583C] text-white text-xs font-semibold transition-colors shadow-xs"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry Authentication</span>
              </button>
            </div>
          )}
        </div>

        {/* Supporting Trust & Security Information */}
        <div className="mt-8 pt-6 border-t border-[#E2E4EE] grid grid-cols-3 gap-3 text-center">
          <div className="space-y-1">
            <Key className="w-4 h-4 text-[#176B4A] mx-auto" />
            <p className="text-[11px] font-semibold text-[#172033]">Wallet-Based</p>
            <p className="text-[10px] text-[#8A93A3]">No password storage</p>
          </div>
          <div className="space-y-1">
            <Lock className="w-4 h-4 text-[#176B4A] mx-auto" />
            <p className="text-[11px] font-semibold text-[#172033]">Non-Custodial</p>
            <p className="text-[10px] text-[#8A93A3]">Private keys stay safe</p>
          </div>
          <div className="space-y-1">
            <Shield className="w-4 h-4 text-[#176B4A] mx-auto" />
            <p className="text-[11px] font-semibold text-[#172033]">Zero Gas Fee</p>
            <p className="text-[10px] text-[#8A93A3]">Off-chain SIWE signature</p>
          </div>
        </div>
      </div>
    </div>
  );
}

