const express = require("express");
const supabase = require("../lib/supabase");
const { analyzeDispute } = require("../lib/ai");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// POST /ai/analyze-dispute — trigger GPT-4o analysis
router.post("/analyze-dispute", requireAuth, async (req, res, next) => {
  const { gigId } = req.body;
  if (!gigId) return res.status(400).json({ error: "gigId required" });

  try {
    // Gather dispute data
    const [disputeRes, evidenceRes, submissionsRes] = await Promise.all([
      supabase.from("disputes").select("*").eq("gig_id", gigId).single(),
      supabase.from("dispute_evidence").select("content").eq("gig_id", gigId),
      supabase.from("submissions").select("description").eq("gig_id", gigId).limit(5),
    ]);

    if (disputeRes.error || !disputeRes.data) {
      return res.status(404).json({ error: "No dispute found for this gig" });
    }

    const dispute = disputeRes.data;
    const evidence = (evidenceRes.data || []).map((e) => e.content);
    const submissionDesc = (submissionsRes.data || []).map((s) => s.description).join("\n");

    // Run AI analysis — will throw 503 if OpenAI not configured
    const recommendation = await analyzeDispute({
      gigId,
      disputeReason: dispute.reason,
      submissionDescription: submissionDesc,
      evidence,
    });

    // Store result in Supabase
    await supabase
      .from("disputes")
      .update({ ai_recommendation: recommendation })
      .eq("gig_id", gigId);

    res.json(recommendation);
  } catch (err) {
    if (err.code === "OPENAI_NOT_CONFIGURED") {
      return res.status(503).json({
        error: err.message,
        code: "OPENAI_NOT_CONFIGURED",
        hint: "Set OPENAI_API_KEY in backend/.env to enable AI dispute analysis",
      });
    }
    next(err);
  }
});

module.exports = router;
