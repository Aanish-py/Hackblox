const express = require("express");
const { v4: uuidv4 } = require("uuid");
const supabase = require("../lib/supabase");
const { requireAuth, optionalAuth } = require("../middleware/auth");

const router = express.Router();

// POST /disputes — create a new dispute ticket
router.post("/", requireAuth, async (req, res, next) => {
  const { gigId, reason } = req.body;
  const raisedBy = req.wallet.address;

  if (!gigId || !reason) return res.status(400).json({ error: "gigId and reason required" });

  try {
    // Check if dispute already exists
    const { data: existing } = await supabase
      .from("disputes")
      .select("id")
      .eq("gig_id", gigId)
      .single();

    if (existing) return res.status(409).json({ error: "Dispute already exists for this gig" });

    const { data, error } = await supabase
      .from("disputes")
      .insert({
        id: uuidv4(),
        gig_id: gigId,
        raised_by: raisedBy,
        reason,
        state: "open",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    res.json({ ...data, evidence: [] });
  } catch (err) {
    next(err);
  }
});

// GET /disputes/:gigId
router.get("/:gigId", optionalAuth, async (req, res, next) => {
  const { gigId } = req.params;
  try {
    const [disputeRes, evidenceRes] = await Promise.all([
      supabase.from("disputes").select("*").eq("gig_id", gigId).single(),
      supabase.from("dispute_evidence").select("*").eq("gig_id", gigId).order("created_at"),
    ]);

    if (disputeRes.error || !disputeRes.data) {
      return res.status(404).json({ error: "No dispute found for this gig" });
    }

    res.json({
      ...disputeRes.data,
      evidence: evidenceRes.data || [],
    });
  } catch (err) {
    next(err);
  }
});

// PUT /disputes/:gigId/evidence — add evidence
router.put("/:gigId/evidence", requireAuth, async (req, res, next) => {
  const { gigId } = req.params;
  const { content, ipfsHash } = req.body;
  const submittedBy = req.wallet.address;

  if (!content) return res.status(400).json({ error: "content required" });

  try {
    const { data, error } = await supabase
      .from("dispute_evidence")
      .insert({
        id: uuidv4(),
        gig_id: gigId,
        submitted_by: submittedBy,
        content,
        ipfs_hash: ipfsHash || null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// PATCH /disputes/:gigId/state — update dispute state (arbitrator only via admin middleware)
router.patch("/:gigId/state", requireAuth, async (req, res, next) => {
  const { gigId } = req.params;
  const { state, resolution } = req.body;

  try {
    const { data, error } = await supabase
      .from("disputes")
      .update({ state, resolution, resolved_at: new Date().toISOString() })
      .eq("gig_id", gigId)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
