import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, Wallet, CheckCircle, ArrowRight } from "lucide-react";
import { useWallet } from "../context/WalletContext";
import api from "../lib/api";

export default function Auth() {
  const { address, signer, isConnected, connect } = useWallet();
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
      // 1. Get nonce from backend
      const nonceRes = await api.get(`/auth/nonce/${address}`);
      const { nonce } = nonceRes.data;

      // 2. Build SIWE message
      const message = [
        "GigChain wants you to sign in with your Ethereum account:",
        address,
        "",
        "Sign in to GigChain — Trustless Freelance Escrow",
        "",
        `URI: ${window.location.origin}`,
        "Version: 1",
        `Chain ID: ${await signer.provider.getNetwork().then((n) => n.chainId)}`,
        `Nonce: ${nonce}`,
        `Issued At: ${new Date().toISOString()}`,
      ].join("\n");

      // 3. Request signature from MetaMask
      const signature = await signer.signMessage(message);

      // 4. Verify on backend → receive JWT
      const verifyRes = await api.post("/auth/verify", { address, message, signature });
      const { token } = verifyRes.data;

      localStorage.setItem("gigchain_jwt", token);
      setDone(true);

      setTimeout(() => navigate("/browse"), 1500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Signature failed";
      setError(msg.includes("rejected") ? "You rejected the signature request." : msg);
    } finally {
      setSigning(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20 page-enter">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #7c3aed, #06b6d4)" }}>
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="heading-lg mb-2">Sign In with Ethereum</h1>
          <p className="text-slate-400 text-sm">
            Prove wallet ownership with a cryptographic signature. No password needed.
          </p>
        </div>

        <div className="glass-card p-8 animated-border">
          {!isConnected ? (
            <div className="text-center">
              <p className="text-slate-400 mb-6 text-sm">Connect your MetaMask wallet first.</p>
              <button onClick={connect} id="auth-connect-btn" className="btn-primary w-full">
                <Wallet className="w-5 h-5" /> Connect Wallet
              </button>
            </div>
          ) : alreadyAuthed && !done ? (
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <p className="text-white font-semibold mb-2">Already signed in</p>
              <p className="text-slate-400 text-sm mb-6">Your session is active.</p>
              <button onClick={() => navigate("/browse")} id="auth-continue-btn" className="btn-primary w-full">
                Continue to App <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          ) : done ? (
            <div className="text-center animate-fade-in">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
              <p className="text-white font-semibold mb-2">Verified!</p>
              <p className="text-slate-400 text-sm">Redirecting to the app...</p>
            </div>
          ) : (
            <>
              {/* Connected wallet info */}
              <div className="glass-card p-4 mb-6" style={{ background: "rgba(124,58,237,0.08)" }}>
                <p className="text-xs text-slate-500 mb-1">Connected wallet</p>
                <p className="font-mono text-brand-300 text-sm break-all">{address}</p>
              </div>

              {/* Steps */}
              <div className="space-y-3 mb-6">
                {[
                  "MetaMask will show you a human-readable message",
                  "Sign it — no gas, no transaction, no funds moved",
                  "Backend verifies the signature and issues a JWT session token",
                ].map((step, i) => (
                  <div key={i} className="flex items-start gap-3 text-sm text-slate-400">
                    <span className="w-5 h-5 rounded-full bg-brand-600/30 text-brand-300 flex items-center justify-center text-xs shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {step}
                  </div>
                ))}
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={handleSign}
                disabled={signing}
                id="siwe-sign-btn"
                className="btn-primary w-full"
              >
                {signing ? (
                  <><Shield className="w-5 h-5 animate-pulse" /> Waiting for signature...</>
                ) : (
                  <><Shield className="w-5 h-5" /> Sign Message to Continue</>
                )}
              </button>
            </>
          )}
        </div>

        <p className="text-center text-xs text-slate-600 mt-4">
          Your private key never leaves MetaMask. This is a read-only signature.
        </p>
      </div>
    </div>
  );
}
