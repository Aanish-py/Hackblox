import { useState, useEffect, useCallback } from "react";
import { useGigEscrowContract } from "./useContract";
import type { Gig, GigWithMilestones, Milestone } from "../lib/types";

export function useGig(gigId: number | null) {
  const contract = useGigEscrowContract();
  const [gig, setGig] = useState<GigWithMilestones | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGig = useCallback(async () => {
    if (!contract || gigId === null) return;
    setLoading(true);
    setError(null);
    try {
      const [rawGig, rawMilestones] = await Promise.all([
        contract.gigs(gigId),
        contract.getMilestones(gigId),
      ]);

      if (!rawGig.exists) {
        setError("Gig not found");
        setGig(null);
        return;
      }

      const milestones: Milestone[] = rawMilestones.map((m: { description: string; value: bigint; completed: boolean }) => ({
        description: m.description,
        value: m.value,
        completed: m.completed,
      }));

      const gigData: GigWithMilestones = {
        gigId: rawGig.gigId,
        client: rawGig.client,
        freelancer: rawGig.freelancer,
        totalBudget: rawGig.totalBudget,
        description: rawGig.description,
        state: Number(rawGig.state),
        exists: rawGig.exists,
        completedMilestoneCount: rawGig.completedMilestoneCount,
        token: rawGig.token,
        startTime: rawGig.startTime,
        milestones,
      };

      setGig(gigData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to fetch gig";
      if (msg.includes("BAD_DATA") || msg.includes("could not decode")) {
        setError("Contract not found on active network. If using local dev, please switch MetaMask to Hardhat Local (http://127.0.0.1:8545).");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [contract, gigId]);

  useEffect(() => {
    fetchGig();
  }, [fetchGig]);

  return { gig, loading, error, refetch: fetchGig };
}

export function useAllGigs(maxCount?: number) {
  const contract = useGigEscrowContract();
  const [gigs, setGigs] = useState<Gig[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!contract) return;
    setLoading(true);
    setError(null);
    try {
      const count = await contract.gigCount();
      const total = Math.min(Number(count), maxCount || 100);
      const promises = [];
      for (let i = total; i >= 1; i--) {
        promises.push(contract.gigs(i));
      }
      const results = await Promise.all(promises);
      const parsed: Gig[] = results
        .filter((g) => g.exists)
        .map((g) => ({
          gigId: g.gigId,
          client: g.client,
          freelancer: g.freelancer,
          totalBudget: g.totalBudget,
          description: g.description,
          state: Number(g.state),
          exists: g.exists,
          completedMilestoneCount: g.completedMilestoneCount,
          token: g.token,
          startTime: g.startTime,
        }));
      setGigs(parsed);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to fetch gigs";
      if (msg.includes("BAD_DATA") || msg.includes("could not decode")) {
        setError("Contract not found on active network. If using local dev, please switch MetaMask to Hardhat Local (http://127.0.0.1:8545).");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [contract, maxCount]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { gigs, loading, error, refetch: fetchAll };
}
