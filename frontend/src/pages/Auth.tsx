import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Shield, Wallet, CheckCircle2, ArrowRight, AlertCircle, Loader2 } from "lucide-react";
import { useWallet } from "../context/WalletContext";
import GigChainLogo from "../components/GigChainLogo";
import api from "../lib/api";

export default function Auth() {
  const { address, signer, isConnected, connect, isConnecting } = useWallet();
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();

  const alreadyAuthed = !!localStorage.getItem("gigchain_jwt");

  const handleSign = async () => {
    if (!signer || !address) return;
    setSigning(true);
    setError(null);

    try {
      // 1. Fetch genuine nonce from backend
      const nonceRes = await api.get(`/auth/nonce/${address}`);
      const { nonce } = nonceRes.data;

      // 2. Formulate standard Sign-In With Ethereum (SIWE) message
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

      // 3. Request cryptographic signature from MetaMask
      const signature = await signer.signMessage(message);

      // 4. Verify on backend and receive session JWT
      const verifyRes = await api.post("/auth/verify", { address, message, signature });
      const { token } = verifyRes.data;

      localStorage.setItem("gigchain_jwt", token);
      setDone(true);

      setTimeout(() => navigate("/my-contracts"), 1200);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Authentication failed";
      setError(
        msg.includes("rejected") || msg.includes("denied")
          ? "Signature was rejected in MetaMask. Please try again to authenticate."
          : msg
      );
    } finally {
      setSigning(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F8FC] text-[#172033] flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Link to="/" aria-label="GigChain Home">
              <GigChainLogo variant="symbol" size="lg" theme="light" />
            </Link>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[#172033] mb-2">
            Sign In with Ethereum
          </h1>
          <p className="text-sm text-[#5F6878]">
            Verify address ownership via cryptographic signature. No passwords or third-party custody required.
          </p>
        </div>

        {/* Authentication Panel */}
        <div className="rounded-xl border border-[#E2E4EE] bg-white p-6 sm:p-8 shadow-xs">
          {!isConnected ? (
            <div className="text-center space-y-5">
              <div className="w-12 h-12 rounded-xl bg-[#E8F5EE] border border-[#23895A]/30 flex items-center justify-center mx-auto text-[#176B4A]">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#172033]">
                  MetaMask Required
                </h3>
                <p className="text-xs text-[#5F6878] mt-1 leading-relaxed">
                  Connect your Web3 wallet to access your contracts, submit deliverables, and manage escrow.
                </p>
              </div>
              <button
                onClick={connect}
                disabled={isConnecting}
                id="auth-connect-btn"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-lg bg-[#176B4A] hover:bg-[#13583C] text-white text-sm font-medium transition-colors shadow-xs disabled:opacity-50"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting Wallet...</span>
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4" />
                    <span>Connect MetaMask</span>
                  </>
                )}
              </button>
            </div>
          ) : alreadyAuthed && !done ? (
            <div className="text-center space-y-4 py-2">
              <div className="w-12 h-12 rounded-xl bg-[#E8F5EE] border border-[#23895A]/30 flex items-center justify-center mx-auto text-[#176B4A]">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-[#172033]">
                  Active Session Verified
                </h3>
                <p className="text-xs text-[#5F6878] mt-1">
                  You are already authenticated with your connected wallet.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[#F8F8FC] border border-[#E2E4EE] font-mono text-xs text-[#172033] break-all text-left">
                <span className="text-[10px] text-[#8A93A3] block uppercase font-semibold mb-0.5">Address</span>
                {address}
              </div>
              <button
                onClick={() => navigate("/my-contracts")}
                id="auth-continue-btn"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-lg bg-[#176B4A] hover:bg-[#13583C] text-white text-sm font-medium transition-colors shadow-xs"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : done ? (
            <div className="text-center space-y-4 py-6">
              <div className="w-12 h-12 rounded-xl bg-[#E8F5EE] border border-[#23895A]/30 flex items-center justify-center mx-auto text-[#176B4A] animate-bounce">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-[#176B4A]">
                Signature Verified!
              </h3>
              <p className="text-xs text-[#5F6878]">
                Opening your GigChain dashboard...
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Connected wallet panel */}
              <div className="p-3.5 rounded-lg bg-[#F8F8FC] border border-[#E2E4EE]">
                <span className="text-[10px] font-mono uppercase text-[#8A93A3] font-semibold block mb-1">
                  Connected Wallet
                </span>
                <p className="font-mono text-xs text-[#176B4A] font-semibold break-all">
                  {address}
                </p>
              </div>

              {/* SIWE Explanation */}
              <div className="space-y-2.5">
                {[
                  "MetaMask will present a human-readable challenge message.",
                  "Zero gas fee, zero blockchain transaction, no funds moved.",
                  "Cryptographic proof issues a secure session token.",
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-[#5F6878]">
                    <span className="w-4 h-4 rounded-full bg-[#E8F5EE] text-[#176B4A] font-mono flex items-center justify-center text-[10px] shrink-0 mt-0.5 border border-[#23895A]/30 font-semibold">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </div>
                ))}
              </div>

              {/* Error display */}
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                  <span className="leading-relaxed">{error}</span>
                </div>
              )}

              {/* Sign Action Button */}
              <button
                onClick={handleSign}
                disabled={signing}
                id="siwe-sign-btn"
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-lg bg-[#176B4A] hover:bg-[#13583C] text-white text-sm font-medium transition-colors shadow-xs disabled:opacity-60"
              >
                {signing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-200" />
                    <span>Waiting for Signature in MetaMask...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 text-emerald-200" />
                    <span>Sign Message to Authenticate</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Security Note */}
        <p className="text-center text-xs text-[#8A93A3] mt-6 leading-relaxed font-medium">
          Your private keys never leave MetaMask. This authentication signature is strictly off-chain and read-only.
        </p>
      </div>
    </div>
  );
}
