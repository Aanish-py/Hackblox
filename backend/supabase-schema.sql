-- ═══════════════════════════════════════════════════════════════
-- GigChain — Supabase PostgreSQL Schema
-- Run this SQL in your Supabase SQL Editor:
-- https://bzazcquvfklqwxrsycyd.supabase.co → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════════

-- ── Profiles ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  wallet_address TEXT PRIMARY KEY,
  display_name   TEXT,
  bio            TEXT,
  skills         TEXT[] DEFAULT '{}',
  portfolio_links TEXT[] DEFAULT '{}',
  avatar_url     TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── Gigs (off-chain index of on-chain gigs) ──────────────────────
CREATE TABLE IF NOT EXISTS gigs (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contract_gig_id  INTEGER UNIQUE NOT NULL,
  client_address   TEXT NOT NULL,
  freelancer_address TEXT,
  description      TEXT,
  total_budget     TEXT,
  token            TEXT DEFAULT '0x0000000000000000000000000000000000000000',
  state            TEXT DEFAULT 'Open',
  milestones       JSONB DEFAULT '[]',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gigs_client ON gigs(client_address);
CREATE INDEX IF NOT EXISTS idx_gigs_freelancer ON gigs(freelancer_address);
CREATE INDEX IF NOT EXISTS idx_gigs_state ON gigs(state);

-- ── Work Submissions ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS submissions (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gig_id            TEXT NOT NULL,
  milestone_index   INTEGER NOT NULL,
  freelancer_address TEXT NOT NULL,
  description       TEXT,
  external_link     TEXT,
  ipfs_hash         TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_submissions_gig ON submissions(gig_id, milestone_index);

-- ── Disputes ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS disputes (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gig_id           TEXT UNIQUE NOT NULL,
  raised_by        TEXT NOT NULL,
  reason           TEXT NOT NULL,
  state            TEXT DEFAULT 'open',
  ai_recommendation JSONB,
  resolution       TEXT,
  resolved_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_disputes_gig ON disputes(gig_id);

-- ── Dispute Evidence ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dispute_evidence (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gig_id       TEXT NOT NULL,
  submitted_by TEXT NOT NULL,
  content      TEXT NOT NULL,
  ipfs_hash    TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evidence_gig ON dispute_evidence(gig_id);

-- ── RLS (Row Level Security) ──────────────────────────────────────
-- Enable RLS on all tables (Supabase requires this for anon access)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE gigs ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispute_evidence ENABLE ROW LEVEL SECURITY;

-- Public read access for all tables
CREATE POLICY "Public read profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Public read gigs" ON gigs FOR SELECT USING (true);
CREATE POLICY "Public read submissions" ON submissions FOR SELECT USING (true);
CREATE POLICY "Public read disputes" ON disputes FOR SELECT USING (true);
CREATE POLICY "Public read evidence" ON dispute_evidence FOR SELECT USING (true);

-- Allow all writes via anon key (backend handles auth)
CREATE POLICY "Backend write profiles" ON profiles FOR ALL USING (true);
CREATE POLICY "Backend write gigs" ON gigs FOR ALL USING (true);
CREATE POLICY "Backend write submissions" ON submissions FOR ALL USING (true);
CREATE POLICY "Backend write disputes" ON disputes FOR ALL USING (true);
CREATE POLICY "Backend write evidence" ON dispute_evidence FOR ALL USING (true);
