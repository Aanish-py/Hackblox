const express = require("express");
const supabase = require("../lib/supabase");
const { pinJSON } = require("../lib/pinata");
const { requireAuth, optionalAuth } = require("../middleware/auth");

const router = express.Router();

// POST /gigs/pin-description — pin gig description to IPFS
router.post("/pin-description", requireAuth, async (req, res, next) => {
  const { description, client } = req.body;
  if (!description) return res.status(400).json({ error: "description required" });
  try {
    const cid = await pinJSON(
      { description, client, timestamp: new Date().toISOString() },
      `gigchain-gig-desc-${Date.now()}`
    );
    res.json({ cid, url: `https://gateway.pinata.cloud/ipfs/${cid}` });
  } catch (err) {
    next(err);
  }
});

// POST /gigs — index a new on-chain gig in the backend DB
router.post("/", requireAuth, async (req, res, next) => {
  const { contractGigId, client, description, totalBudget, token, milestones } = req.body;
  if (!contractGigId || !client) return res.status(400).json({ error: "contractGigId and client required" });

  try {
    const { data, error } = await supabase
      .from("gigs")
      .upsert({
        contract_gig_id: contractGigId,
        client_address: client.toLowerCase(),
        description,
        total_budget: totalBudget,
        token: token || "0x0000000000000000000000000000000000000000",
        state: "Open",
        milestones: milestones || [],
        created_at: new Date().toISOString(),
      }, { onConflict: "contract_gig_id" })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// GET /gigs — browse all indexed gigs
router.get("/", optionalAuth, async (req, res, next) => {
  const { state, token, limit = 50, offset = 0 } = req.query;
  try {
    let query = supabase
      .from("gigs")
      .select("*")
      .order("created_at", { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (state) query = query.eq("state", state);
    if (token) query = query.eq("token", token);

    const { data, error, count } = await query;
    if (error) throw error;
    res.json({ gigs: data || [], total: count || 0 });
  } catch (err) {
    next(err);
  }
});

// GET /gigs/:id — single gig metadata
router.get("/:id", optionalAuth, async (req, res, next) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabase
      .from("gigs")
      .select("*")
      .eq("contract_gig_id", id)
      .single();

    if (error || !data) return res.status(404).json({ error: "Gig not found in index" });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
