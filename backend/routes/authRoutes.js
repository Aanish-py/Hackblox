const express = require("express");
const jwt = require("jsonwebtoken");
const { getNonce, verifySIWE } = require("../middleware/auth");

const router = express.Router();

// GET /auth/nonce/:address
router.get("/nonce/:address", (req, res) => {
  const { address } = req.params;
  if (!address || !address.startsWith("0x")) {
    return res.status(400).json({ error: "Invalid Ethereum address" });
  }
  const nonce = getNonce(address);
  res.json({ nonce });
});

// POST /auth/verify — verify SIWE signature, return JWT
router.post("/verify", async (req, res, next) => {
  const { address, message, signature } = req.body;
  if (!address || !message || !signature) {
    return res.status(400).json({ error: "address, message, and signature required" });
  }
  try {
    await verifySIWE(address, message, signature);
    const token = jwt.sign(
      { address: address.toLowerCase(), iat: Math.floor(Date.now() / 1000) },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.json({ token, address: address.toLowerCase() });
  } catch (err) {
    next({ status: 401, message: err.message, code: "AUTH_FAILED" });
  }
});

module.exports = router;
