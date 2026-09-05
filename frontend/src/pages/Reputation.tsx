import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Award, Trophy, Loader2, AlertCircle, ExternalLink } from "lucide-react";
import { useWallet } from "../context/WalletContext";
import { useReputationBadgeContract, useGigEscrowContract } from "../hooks/useContract";
import BadgeCard from "../components/BadgeCard";
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

        const leaderboardPromise = api.get("/analytics/leaderboard")
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
    <div className="min-h-screen py-10 px-4 page-enter">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="heading-lg mb-1 flex items-center gap-3">
            <Award className="w-8 h-8 text-yellow-400" />
            Reputation
          </h1>
          {target && (
            <div className="flex items-center gap-2 mt-2">
              <span className="font-mono text-sm text-brand-300">{target}</span>
              <a
                href={`https://sepolia.etherscan.io/address/${target}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          )}
        </div>

        {!REPUTATION_BADGE_ADDRESS && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6 text-yellow-400 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Contracts not deployed. Badge data unavailable.
          </div>
        )}

        {!target ? (
          <div className="glass-card p-10 text-center text-slate-400">Connect wallet to see your reputation.</div>
        ) : loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-brand-400 animate-spin" />
          </div>
        ) : error ? (
          <div className="glass-card p-6 text-red-400 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        ) : (
          <>
            {/* On-chain stats */}
            {stats && (
              <div className="grid grid-cols-3 gap-4 mb-8">
                {[
                  { label: "Completed Gigs", value: stats.completedGigs, color: "text-brand-400" },
                  { label: "Total Earnings", value: `${formatEther(stats.totalEarnings)} ETH`, color: "text-cyan-400" },
                  { label: "Win Streak", value: `🔥 ${stats.streak}`, color: "text-orange-400" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="glass-card p-5 text-center">
                    <p className={`font-display font-bold text-2xl ${color} mb-1`}>{value}</p>
                    <p className="text-slate-500 text-xs">{label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Badges */}
            <section className="mb-10">
              <h2 className="heading-md mb-5">NFT Badges ({badges.length})</h2>
              {badges.length === 0 ? (
                <div className="glass-card p-8 text-center text-slate-500">
                  <Award className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p>No badges yet. Complete gigs to earn your first badge!</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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
            </section>

            {/* All possible badges preview */}
            {badges.length < 6 && (
              <section className="mb-10">
                <h2 className="heading-md mb-3 text-slate-400">Badges to Earn</h2>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                  {[0, 1, 2, 3, 4, 5].filter((t) => !badges.find((b) => b.badgeType === t)).map((t) => (
                    <div key={t} className="glass-card p-4 text-center opacity-40">
                      <span className="text-3xl">{BadgeEmoji[t as BadgeType]}</span>
                      <p className="text-xs text-slate-500 mt-2">{BadgeNames[t as BadgeType]}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Leaderboard */}
            {leaderboard.length > 0 && (
              <section>
                <h2 className="heading-md mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-400" /> Top Freelancers
                </h2>
                <div className="glass-card overflow-hidden">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Address</th>
                        <th>Gigs</th>
                        <th>Earnings (ETH)</th>
                        <th>Streak</th>
                        <th>Badges</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.slice(0, 10).map((entry, i) => (
                        <tr key={entry.address} className={entry.address.toLowerCase() === target?.toLowerCase() ? "bg-brand-600/10" : ""}>
                          <td className="font-bold text-slate-400">{i + 1}</td>
                          <td className="font-mono text-xs">
                            {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
                          </td>
                          <td>{entry.completedGigs}</td>
                          <td className="text-cyan-400">{entry.totalEarnings}</td>
                          <td>🔥 {entry.streak}</td>
                          <td>⭐ {entry.badgeCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
