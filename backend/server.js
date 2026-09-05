require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const gigRoutes = require("./routes/gigRoutes");
const submissionRoutes = require("./routes/submissionRoutes");
const disputeRoutes = require("./routes/disputeRoutes");
const aiRoutes = require("./routes/aiRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");

const app = express();
const PORT = process.env.PORT || 4000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:3000"],
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), service: "gigchain-backend" });
});

app.use("/auth", authRoutes);
app.use("/profile", profileRoutes);
app.use("/gigs", gigRoutes);
app.use("/submissions", submissionRoutes);
app.use("/disputes", disputeRoutes);
app.use("/ai", aiRoutes);
app.use("/analytics", analyticsRoutes);

// ─── Error Handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error("[GigChain Backend Error]", err.message);
  res.status(err.status || 500).json({
    error: err.message || "Internal server error",
    code: err.code || "INTERNAL_ERROR",
  });
});

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: "Route not found", path: req.path });
});

app.listen(PORT, () => {
  console.log(`\n🔗 GigChain Backend running on http://localhost:${PORT}`);
  console.log(`   Supabase: ${process.env.SUPABASE_URL ? "✅ Connected" : "❌ Missing SUPABASE_URL"}`);
  console.log(`   Pinata:   ${process.env.PINATA_JWT ? "✅ Connected" : "❌ Missing PINATA_JWT"}`);
  console.log(`   OpenAI:   ${process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== "YOUR_OPENAI_API_KEY_HERE" ? "✅ Connected" : "⚠️  Not configured (AI route will error)"}`);
  console.log(`   JWT:      ${process.env.JWT_SECRET ? "✅ Set" : "❌ Missing JWT_SECRET"}\n`);
});

module.exports = app;
