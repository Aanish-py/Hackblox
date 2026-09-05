import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { BrowserProvider, JsonRpcSigner } from "ethers";
import { SUPPORTED_CHAIN_IDS, CHAIN_NAMES } from "../lib/contracts";

interface WalletContextType {
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  address: string | null;
  chainId: number | null;
  isConnecting: boolean;
  isConnected: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchAccount: () => Promise<void>;
  switchToSepolia: () => Promise<void>;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setAddress(null);
    setChainId(null);
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      setError("MetaMask not found. Please install MetaMask to use GigChain.");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const browserProvider = new BrowserProvider(window.ethereum);
      await browserProvider.send("eth_requestAccounts", []);
      const walletSigner = await browserProvider.getSigner();
      const walletAddress = await walletSigner.getAddress();
      const network = await browserProvider.getNetwork();
      const cId = Number(network.chainId);

      // Invalidate stale authentication if active wallet does not match stored auth address
      const storedAuth = localStorage.getItem("gigchain_auth_address");
      if (storedAuth && storedAuth.toLowerCase() !== walletAddress.toLowerCase()) {
        localStorage.removeItem("gigchain_jwt");
        localStorage.removeItem("gigchain_auth_address");
        window.dispatchEvent(new CustomEvent("gigchain:auth_changed"));
      }

      setProvider(browserProvider);
      setSigner(walletSigner);
      setAddress(walletAddress);
      setChainId(cId);

      localStorage.setItem("gigchain_wallet_connected", "true");

      if (!SUPPORTED_CHAIN_IDS.includes(cId)) {
        setError(`Please switch to a supported network (${Object.values(CHAIN_NAMES).join(" or ")})`);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to connect wallet";
      setError(msg.includes("rejected") ? "Connection rejected by user." : msg);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    resetState();
    localStorage.removeItem("gigchain_wallet_connected");
    localStorage.removeItem("gigchain_jwt");
    localStorage.removeItem("gigchain_auth_address");
    window.dispatchEvent(new CustomEvent("gigchain:auth_changed"));
  }, [resetState]);

  const switchAccount = useCallback(async () => {
    if (!window.ethereum) {
      setError("MetaMask not found. Please install MetaMask to use GigChain.");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Proactively clear existing authentication session before user picks a new account
      localStorage.removeItem("gigchain_jwt");
      localStorage.removeItem("gigchain_auth_address");
      window.dispatchEvent(new CustomEvent("gigchain:auth_changed"));

      // Native MetaMask account selector prompt via EIP-2255
      await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });

      await connect();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Account switch rejected";
      if (
        msg.includes("rejected") ||
        (err as { code?: number })?.code === 4001
      ) {
        setError("Account switch cancelled in MetaMask.");
      } else {
        setError(msg);
      }
    } finally {
      setIsConnecting(false);
    }
  }, [connect]);

  const switchToSepolia = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0xaa36a7" }], // Sepolia
      });
    } catch (switchError: unknown) {
      // Chain not added yet — add it
      if ((switchError as { code: number }).code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: "0xaa36a7",
            chainName: "Sepolia Testnet",
            nativeCurrency: { name: "ETH", symbol: "ETH", decimals: 18 },
            rpcUrls: ["https://eth-sepolia.g.alchemy.com/v2/alch_5AaiPJss5VsY6dSzxV-Ig"],
            blockExplorerUrls: ["https://sepolia.etherscan.io"],
          }],
        });
      }
    }
  }, []);

  // Auto-reconnect on page reload
  useEffect(() => {
    const wasConnected = localStorage.getItem("gigchain_wallet_connected");
    if (wasConnected && window.ethereum) {
      connect();
    }
  }, [connect]);

  // Listen for MetaMask account and chain changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (...args: unknown[]) => {
      const accounts = args[0] as string[];
      if (!accounts || accounts.length === 0) {
        disconnect();
      } else {
        const newAccount = accounts[0].toLowerCase();
        const currentAccount = address?.toLowerCase();

        if (newAccount !== currentAccount) {
          // Clear existing authentication session on account change
          localStorage.removeItem("gigchain_jwt");
          localStorage.removeItem("gigchain_auth_address");
          window.dispatchEvent(new CustomEvent("gigchain:auth_changed"));

          await connect();
        }
      }
    };

    const handleChainChanged = () => {
      connect(); // Re-init on chain change
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, [address, connect, disconnect]);

  // Listen for logout event from API interceptor
  useEffect(() => {
    const handler = () => disconnect();
    window.addEventListener("gigchain:logout", handler);
    return () => window.removeEventListener("gigchain:logout", handler);
  }, [disconnect]);

  return (
    <WalletContext.Provider value={{
      provider,
      signer,
      address,
      chainId,
      isConnecting,
      isConnected: !!address,
      error,
      connect,
      disconnect,
      switchAccount,
      switchToSepolia,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextType {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error("useWallet must be used inside WalletProvider");
  return ctx;
}

// Extend window for MetaMask type
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
    };
  }
}
