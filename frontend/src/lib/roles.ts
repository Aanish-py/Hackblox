/**
 * GigChain Role Utilities
 *
 * Provides reusable, normalized role calculation for gig-level access control.
 *
 * Roles are per-gig: a wallet may have different roles across different gigs.
 * All address comparisons are case-insensitive (normalized to lowercase).
 *
 * IMPORTANT: This is a frontend UX layer only. The smart contract remains the
 * authoritative authorization layer for fund movement.
 */

export type GigRole = "CLIENT" | "FREELANCER" | "ARBITRATOR" | "UNRELATED";

interface GigParties {
  client: string;
  freelancer: string;
}

/**
 * Determines the current wallet's role for a specific gig.
 *
 * @param gig              - Object containing the gig's client and freelancer addresses
 * @param currentAddress   - The currently connected wallet address (null = not connected)
 * @param arbitratorAddress - The protocol arbitrator address read from the deployed contract
 *                           (null = not yet loaded or failed to load; do NOT assume arbitrator)
 * @returns GigRole
 */
export function getGigRole(
  gig: GigParties,
  currentAddress: string | null | undefined,
  arbitratorAddress: string | null | undefined
): GigRole {
  if (!currentAddress) return "UNRELATED";

  const normalized = currentAddress.toLowerCase();
  const clientAddr = gig.client.toLowerCase();
  const freelancerAddr = gig.freelancer.toLowerCase();

  if (normalized === clientAddr) return "CLIENT";
  if (normalized === freelancerAddr) return "FREELANCER";

  // Only match as ARBITRATOR when the address is confirmed from the contract.
  // If arbitratorAddress is null (loading or error), return UNRELATED.
  if (arbitratorAddress && normalized === arbitratorAddress.toLowerCase()) {
    return "ARBITRATOR";
  }

  return "UNRELATED";
}

/**
 * Returns true if the current wallet is a direct party to the gig
 * (client or freelancer). Does NOT include arbitrator.
 */
export function isGigParty(
  gig: GigParties,
  currentAddress: string | null | undefined
): boolean {
  const role = getGigRole(gig, currentAddress, null);
  return role === "CLIENT" || role === "FREELANCER";
}

/**
 * Returns a display label for a gig role, suitable for UI badges.
 */
export const GigRoleLabel: Record<GigRole, string> = {
  CLIENT: "Client",
  FREELANCER: "Freelancer",
  ARBITRATOR: "Arbitrator",
  UNRELATED: "Observer",
};

/**
 * Returns the Tailwind class string for a role badge.
 */
export function getRoleBadgeClass(role: GigRole): string {
  switch (role) {
    case "CLIENT":
      return "bg-[#E8F5EE] text-[#176B4A] border border-[#23895A]/30";
    case "FREELANCER":
      return "bg-[#EEF2FF] text-[#4F46E5] border border-[#6366F1]/30";
    case "ARBITRATOR":
      return "bg-[#FEF3C7] text-[#92400E] border border-[#F59E0B]/40";
    case "UNRELATED":
      return "bg-[#F1F2FA] text-[#5F6878] border border-[#E2E4EE]";
  }
}
