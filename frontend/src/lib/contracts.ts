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

/**
 * ARBITRATOR_ADDRESS_DEV_HINT
 *
 * Development reference only. This value is NOT used for role authorization.
 *
 * The application ALWAYS reads the authoritative arbitrator address from the
 * deployed GigEscrow contract via:
 *
 *   GigEscrow.arbitrator()
 *
 * This constant exists solely for developer orientation — to document which
 * MetaMask account is intended to be the protocol arbitrator. It must NEVER
 * be used as a fallback when the on-chain query fails, and must NEVER be used
 * to bypass the smart contract's actual arbitrator() return value.
 *
 * To assign a new arbitrator: the current on-chain arbitrator must call
 * GigEscrow.setArbitrator(newAddress) — this cannot be done from the frontend.
 */
export const ARBITRATOR_ADDRESS_DEV_HINT = ""; // Set to the intended arbitrator address for local dev reference

if (!GIGESCROW_ADDRESS) {
  console.warn(
    "⚠️ GigChain: Contracts not deployed on Sepolia yet.\n" +
    "   Run in contracts/:\n" +
    "     npx hardhat run scripts/deploy.js --network sepolia"
  );
}
