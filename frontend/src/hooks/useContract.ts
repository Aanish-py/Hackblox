import { useMemo } from "react";
import { ethers } from "ethers";
import { useWallet } from "../context/WalletContext";
import GigEscrowABI from "../abi/GigEscrow.json";
import ReputationBadgeABI from "../abi/ReputationBadge.json";
import { GIGESCROW_ADDRESS, REPUTATION_BADGE_ADDRESS, CHAIN_ID, SEPOLIA_RPC_URL } from "../lib/contracts";

const fallbackSepoliaProvider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);

export function useGigEscrowContract() {
  const { signer, provider, chainId } = useWallet();

  return useMemo(() => {
    if (!GIGESCROW_ADDRESS) return null;
    let runner: ethers.ContractRunner | null = null;
    if (chainId === CHAIN_ID && (signer || provider)) {
      runner = signer || provider;
    } else {
      runner = fallbackSepoliaProvider;
    }

    if (!runner) return null;
    return new ethers.Contract(GIGESCROW_ADDRESS, GigEscrowABI, runner);
  }, [signer, provider, chainId]);
}

export function useReputationBadgeContract() {
  const { signer, provider, chainId } = useWallet();

  return useMemo(() => {
    if (!REPUTATION_BADGE_ADDRESS) return null;
    let runner: ethers.ContractRunner | null = null;
    if (chainId === CHAIN_ID && (signer || provider)) {
      runner = signer || provider;
    } else {
      runner = fallbackSepoliaProvider;
    }

    if (!runner) return null;
    return new ethers.Contract(REPUTATION_BADGE_ADDRESS, ReputationBadgeABI, runner);
  }, [signer, provider, chainId]);
}

export function useContracts() {
  const escrow = useGigEscrowContract();
  const badge = useReputationBadgeContract();

  return {
    escrow,
    badge,
    isDeployed: !!GIGESCROW_ADDRESS && !!REPUTATION_BADGE_ADDRESS,
  };
}
