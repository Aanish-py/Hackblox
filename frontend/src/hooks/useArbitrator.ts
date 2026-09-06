import { useState, useEffect } from "react";
import { useGigEscrowContract } from "./useContract";

interface UseArbitratorResult {
  arbitratorAddress: string | null;
  loading: boolean;
  error: string | null;
}

/**
 * Reads the protocol arbitrator address from the deployed GigEscrow contract.
 *
 * IMPORTANT: Never assumes the current wallet is the arbitrator if the contract
 * query fails or is still loading. `arbitratorAddress` remains null until the
 * contract confirms the value.
 */
export function useArbitrator(): UseArbitratorResult {
  const contract = useGigEscrowContract();
  const [arbitratorAddress, setArbitratorAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!contract) {
      // Contract not yet available (no address configured or still initializing)
      setLoading(true);
      setArbitratorAddress(null);
      setError(null);
      return;
    }

    let cancelled = false;

    const fetchArbitrator = async () => {
      setLoading(true);
      setError(null);
      try {
        const addr: string = await contract.arbitrator();
        if (!cancelled) {
          setArbitratorAddress(addr.toLowerCase());
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : "Failed to read arbitrator";
          setError(msg.slice(0, 120));
          // Explicitly keep null — do NOT default to arbitrator on failure
          setArbitratorAddress(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchArbitrator();

    return () => {
      cancelled = true;
    };
  }, [contract]);

  return { arbitratorAddress, loading, error };
}
