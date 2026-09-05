const express = require("express");
const supabase = require("../lib/supabase");

const router = express.Router();

// GET /analytics/stats — platform-wide totals
router.get("/stats", async (req, res, next) => {
  try {
    const [gigsRes, usersRes, badgesRes] = await Promise.all([
      supabase.from("gigs").select("total_budget, state", { count: "exact" }),
      supabase.from("profiles").select("wallet_address", { count: "exact" }),
      supabase.rpc("count_badges").catch(() => ({ data: 0 })),
    ]);

    const gigs = gigsRes.data || [];
    const completedGigs = gigs.filter((g) => g.state === "Completed");
    const totalVolume = completedGigs.reduce((sum, g) => sum + parseFloat(g.total_budget || 0), 0);

    res.json({
      totalGigs: gigsRes.count || gigs.length,
      totalVolume: totalVolume.toFixed(4),
      totalUsers: usersRes.count || 0,
      totalBadges: typeof badgesRes.data === "number" ? badgesRes.data : 0,
    });
  } catch (err) {
    // Return zeros if DB unavailable rather than crashing
    res.json({ totalGigs: 0, totalVolume: "0.0000", totalUsers: 0, totalBadges: 0 });
  }
});

// GET /analytics/leaderboard — top freelancers
router.get("/leaderboard", async (req, res, next) => {
  try {
    const { data, error } = await supabase
      .from("gigs")
      .select("freelancer_address, total_budget, state")
      .eq("state", "Completed")
      .not("freelancer_address", "is", null);

    if (error) throw error;

    // Aggregate by freelancer
    const stats = {};
    for (const gig of data || []) {
      const addr = gig.freelancer_address;
      if (!addr) continue;
      if (!stats[addr]) {
        stats[addr] = { address: addr, completedGigs: 0, totalEarnings: 0, streak: 0, badgeCount: 0 };
      }
      stats[addr].completedGigs++;
      stats[addr].totalEarnings += parseFloat(gig.total_budget || 0);
    }

    const entries = Object.values(stats)
      .sort((a, b) => b.totalEarnings - a.totalEarnings)
      .slice(0, 20)
      .map((e) => ({ ...e, totalEarnings: e.totalEarnings.toFixed(4) }));

    res.json({ entries });
  } catch (err) {
    res.json({ entries: [] });
  }
});

module.exports = router;
