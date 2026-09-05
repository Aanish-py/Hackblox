const express = require("express");
const supabase = require("../lib/supabase");
const { requireAuth, optionalAuth } = require("../middleware/auth");

const router = express.Router();

// GET /profile/:address — public profile
router.get("/:address", optionalAuth, async (req, res, next) => {
  const { address } = req.params;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("wallet_address", address.toLowerCase())
      .single();

    if (error || !data) {
      return res.json({
        address: address.toLowerCase(),
        displayName: "",
        bio: "",
        skills: [],
        portfolioLinks: [],
        avatarUrl: "",
      });
    }

    res.json({
      address: data.wallet_address,
      displayName: data.display_name || "",
      bio: data.bio || "",
      skills: data.skills || [],
      portfolioLinks: data.portfolio_links || [],
      avatarUrl: data.avatar_url || "",
    });
  } catch (err) {
    next(err);
  }
});

// PUT /profile/:address — update own profile (requires auth)
router.put("/:address", requireAuth, async (req, res, next) => {
  const { address } = req.params;
  if (req.wallet.address !== address.toLowerCase()) {
    return res.status(403).json({ error: "Cannot modify another user's profile" });
  }

  const { displayName, bio, skills, portfolioLinks, avatarUrl } = req.body;

  try {
    const { data, error } = await supabase
      .from("profiles")
      .upsert({
        wallet_address: address.toLowerCase(),
        display_name: displayName || "",
        bio: bio || "",
        skills: Array.isArray(skills) ? skills : [],
        portfolio_links: Array.isArray(portfolioLinks) ? portfolioLinks : [],
        avatar_url: avatarUrl || "",
        updated_at: new Date().toISOString(),
      }, { onConflict: "wallet_address" })
      .select()
      .single();

    if (error) {
      console.error("[Profile Upsert Error]:", error);
      return res.status(500).json({ error: error.message || "Failed to update profile", details: error });
    }

    res.json({
      address: data.wallet_address,
      displayName: data.display_name,
      bio: data.bio,
      skills: data.skills,
      portfolioLinks: data.portfolio_links,
      avatarUrl: data.avatar_url,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
