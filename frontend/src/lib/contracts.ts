// Contract addresses — populated by contracts/scripts/deploy.js after deployment

import addressesJson from "./addresses.json";

export const GIGESCROW_ADDRESS: string = addressesJson.GigEscrow || "";
export const REPUTATION_BADGE_ADDRESS: string = addressesJson.ReputationBadge || "";
export const CHAIN_ID: number = parseInt((addressesJson as { chainId?: string }).chainId || "11155111");
export const NETWORK_NAME: string = (addressesJson as { network?: string }).network || "sepolia";

export const SEPOLIA_RPC_URL = "https://eth-sepolia.g.alchemy.com/v2/alch_5AaiPJss5VsY6dSzxV-Ig";

export const SUPPORTED_CHAIN_IDS = [11155111]; // Sepolia Testnet

export const CHAIN_NAMES: Record<number, string> = {
  11155111: "Sepolia Testnet",
};

if (!GIGESCROW_ADDRESS) {
  console.warn(
    "⚠️ GigChain: Contracts not deployed on Sepolia yet.\n" +
    "   Run in contracts/:\n" +
    "     npx hardhat run scripts/deploy.js --network sepolia"
  );
}
