const express = require("express");
const multer = require("multer");
const supabase = require("../lib/supabase");
const { pinFile, pinJSON } = require("../lib/pinata");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// POST /submissions — freelancer submits work evidence
router.post("/", requireAuth, upload.single("file"), async (req, res, next) => {
  const { gigId, milestoneIndex, description, externalLink } = req.body;
  const freelancer = req.wallet.address;

  if (!gigId || milestoneIndex === undefined || !description) {
    return res.status(400).json({ error: "gigId, milestoneIndex, and description required" });
  }

  try {
    let ipfsHash = null;

    // Pin file if provided
    if (req.file) {
      ipfsHash = await pinFile(req.file.buffer, req.file.originalname);
    } else if (description) {
      // Pin submission as JSON
      ipfsHash = await pinJSON({
        gigId,
        milestoneIndex,
        description,
        externalLink,
        freelancer,
        submittedAt: new Date().toISOString(),
      }, `gigchain-submission-${gigId}-${milestoneIndex}`);
    }

    const { data, error } = await supabase
      .from("submissions")
      .insert({
        gig_id: gigId,
        milestone_index: parseInt(milestoneIndex),
        freelancer_address: freelancer,
        description,
        external_link: externalLink || null,
        ipfs_hash: ipfsHash,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    res.json({
      id: data.id,
      gigId,
      milestoneIndex,
      ipfsHash,
      ipfsUrl: ipfsHash ? `https://gateway.pinata.cloud/ipfs/${ipfsHash}` : null,
    });
  } catch (err) {
    next(err);
  }
});

// GET /submissions/:gigId/:milestoneIndex
router.get("/:gigId/:milestoneIndex", async (req, res, next) => {
  const { gigId, milestoneIndex } = req.params;
  try {
    const { data, error } = await supabase
      .from("submissions")
      .select("*")
      .eq("gig_id", gigId)
      .eq("milestone_index", milestoneIndex)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
