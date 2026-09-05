const jwt = require("jsonwebtoken");
const { ethers } = require("ethers");

const JWT_SECRET = process.env.JWT_SECRET;
const nonces = new Map(); // In-memory nonce store — replace with DB in production

/**
 * Get or generate a nonce for a wallet address (for SIWE)
 */
function getNonce(address) {
  const nonce = Math.random().toString(36).slice(2) + Date.now().toString(36);
  nonces.set(address.toLowerCase(), nonce);
  return nonce;
}

/**
 * Verify SIWE signature and return JWT
 */
async function verifySIWE(address, message, signature) {
  const recovered = ethers.verifyMessage(message, signature);
  if (recovered.toLowerCase() !== address.toLowerCase()) {
    throw new Error("Signature does not match address");
  }
  const storedNonce = nonces.get(address.toLowerCase());
  if (!storedNonce || !message.includes(storedNonce)) {
    throw new Error("Invalid or expired nonce");
  }
  nonces.delete(address.toLowerCase());
  return true;
}

/**
 * JWT middleware — attaches req.wallet = { address }
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing auth token", code: "MISSING_TOKEN" });
  }
  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.wallet = decoded;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token", code: "INVALID_TOKEN" });
  }
}

/**
 * Optional auth — attaches wallet if present, continues either way
 */
function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      const decoded = jwt.verify(header.slice(7), JWT_SECRET);
      req.wallet = decoded;
    } catch {
      // Invalid token — ignore, treat as unauthenticated
    }
  }
  next();
}

module.exports = { getNonce, verifySIWE, requireAuth, optionalAuth };
