import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Award, Trophy, Loader2, AlertCircle, ExternalLink, Flame, CheckCircle, Wallet } from "lucide-react";
import { useWallet } from "../context/WalletContext";
import { useReputationBadgeContract, useGigEscrowContract } from "../hooks/useContract";
import BadgeCard from "../components/BadgeCard";
import DashboardShell from "../components/DashboardShell";
import { BadgeType, BadgeNames, BadgeEmoji, formatEther } from "../lib/types";
import { REPUTATION_BADGE_ADDRESS } from "../lib/contracts";
import api from "../lib/api";

interface BadgeInfo {
  tokenId: number;
  badgeType: BadgeType;
  level: number;
  value: number;
  mintedAt: number;
}

interface LeaderboardEntry {
  address: string;
  completedGigs: number;
  totalEarnings: string;
  streak: number;
  badgeCount: number;
}

export default function Reputation() {
  const { address: paramAddr } = useParams<{ address?: string }>();
  const { address: connectedAddr } = useWallet();
  const target = paramAddr || connectedAddr;
  const badgeContract = useReputationBadgeContract();
  const escrowContract = useGigEscrowContract();
  const [badges, setBadges] = useState<BadgeInfo[]>([]);
  const [stats, setStats] = useState<{ completedGigs: number; totalEarnings: bigint; streak: number } | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!target) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const badgePromise = badgeContract
          ? (async () => {
              const tokenIds = await badgeContract.getUserBadges(target);
              const infos: BadgeInfo[] = await Promise.all(
                (tokenIds as bigint[]).map(async (id) => {
                  const [bt, level, value, mintedAt] = await badgeContract.getBadgeInfo(id);
                  return {
                    tokenId: Number(id),
                    badgeType: Number(bt) as BadgeType,
                    level: Number(level),
                    value: Number(value),
                    mintedAt: Number(mintedAt),
                  };
                })
              );
              return infos;
            })()
          : Promise.resolve([]);

        const statsPromise = escrowContract
          ? (async () => {
              const [completed, earnings, streak] = await Promise.all([
                escrowContract.completedGigs(target),
                escrowContract.totalEarnings(target),
                escrowContract.currentStreak(target),
              ]);
              return { completedGigs: Number(completed), totalEarnings: earnings as bigint, streak: Number(streak) };
            })()
          : Promise.resolve(null);

        const leaderboardPromise = api
          .get("/analytics/leaderboard")
          .then((r) => r.data.entries as LeaderboardEntry[])
          .catch(() => [] as LeaderboardEntry[]);

        const [badgeData, statsData, lb] = await Promise.all([badgePromise, statsPromise, leaderboardPromise]);
        setBadges(badgeData);
        setStats(statsData);
        setLeaderboard(lb);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load reputation data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [target, badgeContract, escrowContract]);

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E4EE]">
          <div>
            <h1 className="text-2xl font-bold text-[#172033] tracking-tight flex items-center gap-2.5">
              <Award className="w-6 h-6 text-[#176B4A]" />
              <span>On-Chain Reputation</span>
            </h1>
            <p className="text-[#5F6878] text-sm mt-0.5">
              Cryptographically verified track record, soulbound NFT badges, and earnings history.
            </p>
          </div>

          {target && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-[#E2E4EE] text-xs shadow-xs">
              <span className="text-[#8A93A3]">Wallet:</span>
              <span className="font-mono font-medium text-[#172033]">
                {target.slice(0, 6)}...{target.slice(-4)}
              </span>
              <a
                href={`https://sepolia.etherscan.io/address/${target}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#8A93A3] hover:text-[#176B4A] transition-colors ml-1"
                title="View on Etherscan"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </div>

        {!REPUTATION_BADGE_ADDRESS && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-900 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <p className="font-semibold">ReputationBadge contract not deployed</p>
              <p className="text-xs text-amber-700 mt-0.5">Badge data is unavailable until contracts are deployed.</p>
            </div>
          </div>
        )}

        {!target ? (
          <div className="bg-white border border-[#E2E4EE] rounded-xl p-12 text-center max-w-md mx-auto my-8 shadow-xs">
            <Wallet className="w-10 h-10 text-[#8A93A3] mx-auto mb-3" />
            <h2 className="text-base font-bold text-[#172033] mb-1">Connect Wallet to View Reputation</h2>
            <p className="text-xs text-[#5F6878]">
              Connect your MetaMask wallet or navigate to a public address to view on-chain achievements.
            </p>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-[#176B4A] animate-spin" />
            <p className="text-xs text-[#5F6878]">Querying blockchain reputation records...</p>
          </div>
        ) : error ? (
          <div className="bg-white border border-[#E2E4EE] rounded-xl p-6 shadow-xs flex items-center gap-3 text-red-600 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          <>
            {/* Real On-Chain KPI Cards */}
            {stats && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-[#E2E4EE] rounded-xl p-5 shadow-xs">
                  <div className="flex items-center justify-between text-[#8A93A3] mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Completed Gigs</span>
                    <CheckCircle className="w-4 h-4 text-[#176B4A]" />
                  </div>
                  <p className="text-3xl font-extrabold text-[#172033] font-mono">{stats.completedGigs}</p>
                  <p className="text-xs text-[#5F6878] mt-1">Verified on-chain escrows</p>
                </div>

                <div className="bg-white border border-[#E2E4EE] rounded-xl p-5 shadow-xs">
                  <div className="flex items-center justify-between text-[#8A93A3] mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Total Earnings</span>
                    <span className="text-xs font-mono font-bold text-[#176B4A]">ETH</span>
                  </div>
                  <p className="text-3xl font-extrabold text-[#176B4A] font-mono">
                    {formatEther(stats.totalEarnings)}
                  </p>
                  <p className="text-xs text-[#5F6878] mt-1">Released from escrow contracts</p>
                </div>

                <div className="bg-white border border-[#E2E4EE] rounded-xl p-5 shadow-xs">
                  <div className="flex items-center justify-between text-[#8A93A3] mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider">Active Streak</span>
                    <Flame className="w-4 h-4 text-orange-500" />
                  </div>
                  <p className="text-3xl font-extrabold text-[#172033] font-mono">{stats.streak}</p>
                  <p className="text-xs text-[#5F6878] mt-1">Consecutive gigs without dispute</p>
                </div>
              </div>
            )}

            {/* Earned Badges Section */}
            <div className="bg-white border border-[#E2E4EE] rounded-xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E4EE]">
                <div>
                  <h2 className="text-base font-bold text-[#172033]">Soulbound NFT Badges</h2>
                  <p className="text-xs text-[#5F6878] mt-0.5">Non-transferable ERC-721 credentials minted on milestone completions.</p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E8F5EE] text-[#176B4A] border border-[#23895A]/30">
                  {badges.length} Earned
                </span>
              </div>

              {badges.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="w-12 h-12 rounded-full bg-[#F1F2FA] flex items-center justify-center mx-auto mb-3">
                    <Award className="w-6 h-6 text-[#8A93A3]" />
                  </div>
                  <p className="text-sm font-bold text-[#172033] mb-1">No badges yet</p>
                  <p className="text-xs text-[#5F6878] max-w-sm mx-auto">
                    Complete milestones on GigChain contracts to automatically mint your first verified soulbound reputation badge.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {badges.map((b) => (
                    <BadgeCard
                      key={b.tokenId}
                      badgeType={b.badgeType}
                      level={b.level}
                      value={b.value}
                      mintedAt={b.mintedAt}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Unearned Badges Catalog */}
            {badges.length < 6 && (
              <div className="bg-white border border-[#E2E4EE] rounded-xl p-6 shadow-xs space-y-4">
                <div>
                  <h2 className="text-sm font-bold text-[#172033]">Available Badges to Unlock</h2>
                  <p className="text-xs text-[#5F6878] mt-0.5">Complete contract milestones and build streaks to mint these badges.</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[0, 1, 2, 3, 4, 5]
                    .filter((t) => !badges.find((b) => b.badgeType === t))
                    .map((t) => (
                      <div
                        key={t}
                        className="bg-[#F8F8FC] border border-dashed border-[#E2E4EE] rounded-xl p-4 text-center opacity-70 hover:opacity-100 transition-opacity"
                      >
                        <span className="text-2xl block mb-2">{BadgeEmoji[t as BadgeType]}</span>
                        <p className="text-xs font-semibold text-[#172033]">{BadgeNames[t as BadgeType]}</p>
                        <span className="text-[10px] text-[#8A93A3] mt-1 block">Locked</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Real Platform Leaderboard */}
            {leaderboard.length > 0 && (
              <div className="bg-white border border-[#E2E4EE] rounded-xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E2E4EE]">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    <h2 className="text-base font-bold text-[#172033]">Top Freelancers</h2>
                  </div>
                  <span className="text-xs text-[#5F6878]">Ranked by verified on-chain completions</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-[#E2E4EE] text-[#8A93A3] uppercase text-[10px] tracking-wider">
                        <th className="py-2.5 px-3">#</th>
                        <th className="py-2.5 px-3">Wallet</th>
                        <th className="py-2.5 px-3 text-right">Gigs</th>
                        <th className="py-2.5 px-3 text-right">Earnings (ETH)</th>
                        <th className="py-2.5 px-3 text-center">Streak</th>
                        <th className="py-2.5 px-3 text-center">Badges</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F2FA]">
                      {leaderboard.slice(0, 10).map((entry, i) => {
                        const isSelf = entry.address.toLowerCase() === target?.toLowerCase();
                        return (
                          <tr
                            key={entry.address}
                            className={`transition-colors ${
                              isSelf ? "bg-[#E8F5EE]/60 font-semibold" : "hover:bg-[#F8F8FC]"
                            }`}
                          >
                            <td className="py-2.5 px-3 text-[#8A93A3] font-mono">{i + 1}</td>
                            <td className="py-2.5 px-3 font-mono text-[#172033]">
                              {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
                              {isSelf && (
                                <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-[#176B4A] text-white">
                                  You
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-[#172033]">{entry.completedGigs}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-[#176B4A] font-semibold">
                              {entry.totalEarnings}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono">
                              <span className="inline-flex items-center gap-1 text-orange-600 font-semibold">
                                <Flame className="w-3 h-3" /> {entry.streak}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono text-[#7567C7] font-semibold">
                              {entry.badgeCount}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardShell>
  );
}

