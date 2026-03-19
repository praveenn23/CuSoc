-- ============================================================
-- Supabase SQL Schema — CuSOC Event Booking System
-- Safe to re-run: uses CREATE IF NOT EXISTS, CREATE OR REPLACE,
-- DROP POLICY IF EXISTS, and a singleton constraint on event.
-- ============================================================
-- ────────────────────────────────────────────────────────────
-- Extension: UUID generation
-- ────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
-- ────────────────────────────────────────────────────────────
-- Table: event  (single row — your event details)
-- The `singleton` column + unique index ensures only 1 row
-- is ever allowed, making ON CONFLICT (singleton) safe.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  singleton BOOLEAN NOT NULL DEFAULT TRUE,
  -- enforces single-row table
  title TEXT NOT NULL,
  description TEXT,
  date TIMESTAMPTZ NOT NULL,
  time TEXT,
  -- display string e.g. "9:30 AM – 4:30 PM IST"
  venue TEXT NOT NULL,
  total_seats INTEGER NOT NULL DEFAULT 100 CHECK (total_seats > 0),
  booked_seats INTEGER NOT NULL DEFAULT 0 CHECK (booked_seats >= 0),
  -- ── Dynamic content sections ──────────────────────────────────────
  -- about_text: intro paragraph shown in "About the Event" card
  about_text TEXT,
  -- event_sections: array of { title, items[] } — powers the 3-column grid
  -- e.g. What You'll Learn, Who Should Attend, GSoC Insights, Key Outcomes
  event_sections JSONB DEFAULT '[]'::jsonb,
  -- speakers: array of { name, role, bio, linkedin, color, initials }
  speakers JSONB DEFAULT '[]'::jsonb,
  -- partners: array of { name, logo_url }
  partners JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Add columns if table already exists (safe for re-runs)
ALTER TABLE event ADD COLUMN IF NOT EXISTS about_text TEXT;
ALTER TABLE event ADD COLUMN IF NOT EXISTS event_sections JSONB DEFAULT '[]'::jsonb;
ALTER TABLE event ADD COLUMN IF NOT EXISTS speakers JSONB DEFAULT '[]'::jsonb;
ALTER TABLE event ADD COLUMN IF NOT EXISTS partners JSONB DEFAULT '[]'::jsonb;
-- Unique index on singleton: only 1 row with singleton=TRUE can ever exist
CREATE UNIQUE INDEX IF NOT EXISTS event_singleton_idx ON event (singleton);
-- ────────────────────────────────────────────────────────────
-- Table: registrations
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  -- one registration per email
  phone TEXT NOT NULL,
  cluster TEXT,
  department TEXT,
  achievement_level TEXT,
  rank TEXT,
  competition_name TEXT,
  awards_prize TEXT,
  proof_1_url TEXT,
  proof_2_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ticket_sent_at TIMESTAMPTZ DEFAULT NULL,
  attended_at TIMESTAMPTZ DEFAULT NULL
);

-- ADD NEW COLUMNS IF TABLE ALREADY EXISTS (Safe for re-runs)
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS cluster TEXT;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS achievement_level TEXT;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS rank TEXT;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS competition_name TEXT;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS awards_prize TEXT;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS proof_1_url TEXT;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS proof_2_url TEXT;

-- Fast email lookups (duplicate check, OTP match)
CREATE INDEX IF NOT EXISTS idx_registrations_email ON registrations(email);

-- ────────────────────────────────────────────────────────────
-- Storage Bucket Setup for Proofs
-- ────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public) 
VALUES ('proofs', 'proofs', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'proofs');

-- Allow authenticated insert
DROP POLICY IF EXISTS "Anon Insert" ON storage.objects;
CREATE POLICY "Anon Insert" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'proofs');
-- ────────────────────────────────────────────────────────────
-- Table: otp_verifications
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS otp_verifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  otp TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Fast OTP lookups
CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_verifications(email);
-- ────────────────────────────────────────────────────────────
-- Function: increment_booked_seats
-- Called on successful registration (race-condition safe)
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_booked_seats(event_id UUID) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN
UPDATE event
SET booked_seats = booked_seats + 1
WHERE id = event_id
  AND booked_seats < total_seats;
-- prevents over-booking
IF NOT FOUND THEN RAISE EXCEPTION 'Event is full or not found: %',
event_id;
END IF;
END;
$$;
-- ────────────────────────────────────────────────────────────
-- Function: decrement_booked_seats
-- Called when admin deletes a registration (floored at 0)
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION decrement_booked_seats() RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN
UPDATE event
SET booked_seats = GREATEST(booked_seats - 1, 0);
END;
$$;
-- ────────────────────────────────────────────────────────────
-- Function: sync_booked_seats
-- Utility — run manually to fix any drift between
-- the registrations count and booked_seats value
-- Usage: SELECT sync_booked_seats();
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION sync_booked_seats() RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN
UPDATE event
SET booked_seats = (
    SELECT COUNT(*)
    FROM registrations
  );
END;
$$;
-- ────────────────────────────────────────────────────────────
-- Function: find_by_ticket_code
-- Used by admin attendance scanner.
-- Ticket code = last 4 chars of the registration UUID (uppercase).
-- e.g. UUID "...a1b2c3d4" → ticket code "C3D4"
-- Doing this at DB level avoids fetching all rows and has no row-limit issues.
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION find_by_ticket_code(ticket text)
RETURNS SETOF registrations
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT * FROM registrations
  WHERE UPPER(RIGHT(id::text, 4)) = UPPER(ticket)
  LIMIT 1;
$$;
-- ────────────────────────────────────────────────────────────
-- Row Level Security (RLS)
-- ────────────────────────────────────────────────────────────
ALTER TABLE event ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;
-- ── event policies ──────────────────────────────────────────
-- Anyone can read the event (public landing page)
DROP POLICY IF EXISTS "Public can read event" ON event;
CREATE POLICY "Public can read event" ON event FOR
SELECT TO anon,
  authenticated USING (true);
-- Only service_role (backend) can modify the event row
DROP POLICY IF EXISTS "Service role manages event" ON event;
CREATE POLICY "Service role manages event" ON event FOR ALL TO service_role USING (true) WITH CHECK (true);
-- ── registrations policies ──────────────────────────────────
-- Only backend (service_role) can read/write registrations
DROP POLICY IF EXISTS "Service role manages registrations" ON registrations;
CREATE POLICY "Service role manages registrations" ON registrations FOR ALL TO service_role USING (true) WITH CHECK (true);
-- ── otp_verifications policies ──────────────────────────────
-- Only backend (service_role) can read/write OTPs
DROP POLICY IF EXISTS "Service role manages OTPs" ON otp_verifications;
CREATE POLICY "Service role manages OTPs" ON otp_verifications FOR ALL TO service_role USING (true) WITH CHECK (true);
-- ────────────────────────────────────────────────────────────
-- Seed: Insert or Update your event details
-- ON CONFLICT (singleton) DO UPDATE = upsert pattern.
-- Re-running this script updates event details but PRESERVES
-- booked_seats so you don't lose registration count.
-- ────────────────────────────────────────────────────────────
INSERT INTO event (
    singleton,
    title,
    description,
    date,
    time,
    venue,
    total_seats,
    booked_seats,
    about_text,
    event_sections,
    speakers,
    partners
  )
VALUES (
    TRUE,
    'CuSOC: Chandigarh University Source of Code-  An Open Source Awareness Session',
    'Join us for an intensive, hands-on workshop focused on contributing to real-world applications through open-source development. This event is designed to bridge the gap between theoretical knowledge and practical implementation by guiding participants through live projects, collaborative workflows, and industry-standard tools.

Throughout the session, participants will:

Understand the fundamentals of open-source ecosystems

Learn how to find and evaluate beginner-friendly repositories

Get hands-on experience with Git, GitHub workflows, and pull requests

Contribute to live projects under expert mentorship

Collaborate with like-minded developers in a structured environment

Whether you''re a beginner looking to make your first open-source contribution or a developer aiming to strengthen your practical skills, this workshop will provide structured guidance, real-time feedback, and actionable learning.

By the end of the event, participants will have:

A clear understanding of open-source contribution processes

Practical experience working on production-level code

Improved collaboration and version control skills

A stronger developer profile with real contributions

Spaces are strictly limited to ensure personalized mentoring and effective hands-on support. Early registration is highly recommended.',
    '2026-03-06 09:30:00+05:30',
    '09:30 AM – 04:30 PM IST',
    'D1-Auditorium, Chandigarh University, Mohali, Punjab',
    300,
    0,
    'Join us for an intensive, hands-on workshop focused on contributing to real-world applications through open-source development. This event is specially designed to bridge the gap between theoretical knowledge and practical implementation.',
    '[
      {"title":"What You''ll Learn","column":2,"items":["Understand the fundamentals of open-source ecosystems","Learn how to find and evaluate beginner-friendly repositories","Get hands-on experience with Git, GitHub workflows, and pull requests","Understand issues, commits, branching strategies, and code reviews","Contribute to live projects under expert mentorship","Collaborate with like-minded developers in a structured environment","Learn how to build a strong GitHub profile for internships & global programs"]},
      {"title":"Who Should Attend?","column":1,"items":["1st, 2nd, 3rd year B.Tech / B.E students","Developers interested in open-source","Anyone aiming for GSoC 2026","Students who want real-world coding exposure"]},
      {"title":"GSoC 2026 Insights","column":3,"items":["Google Summer of Code is a prestigious global program by Google.","Indian students receive approximate stipends of $3,000 – $6,000 USD (based on project size).","Selected contributors receive an official GSoC certificate from Google.","Experience equivalent to a high-quality international internship.","Networking with international mentors and global recognition."]},
      {"title":"Key Outcomes","column":3,"items":["A clear understanding of open-source contribution processes","Practical experience working on production-level code","Improved collaboration and version control skills","A stronger developer profile with real contributions","A roadmap for preparing for GSoC 2026"]}
    ]'::jsonb,
    '[
      {"id":1,"name":"Praveen Kumar","role":"CEO, Google","bio":"Expert in designing and developing AI system in production with a strong experience in Data Engineering.","linkedin":"https://www.linkedin.com/in/","color":"#1a73e8","initials":"pk"},
      {"id":2,"name":"Harshit","role":"AI Engineer, ZS Associate","bio":"A multi-year GSoC contributor and AI engineer specializing in large-scale agentic systems.","linkedin":"https://www.linkedin.com/in/","color":"#34a853","initials":"pk"},
      {"id":3,"name":"Shivansh","role":"SDE, Cognizant","bio":"A skilled Android engineer and GSoC alumnus with strong expertise in building high-performance.","linkedin":"https://www.linkedin.com/in/","color":"#ea4335","initials":"pk"},
      {"id":4,"name":"Hassan","role":"SDE, Cognizant","bio":"A highly accomplished AI and Open-Source engineer with GSoC and Summer of Bitcoin expertise.","linkedin":"https://www.linkedin.com/in/","color":"#fbbc04","initials":"pk"}
    ]'::jsonb,
    '[
      {"id":1,"name":"CAC","logo_url":""},
      {"id":2,"name":"CU Play Nation","logo_url":""}
    ]'::jsonb
  ) ON CONFLICT (singleton) DO NOTHING;
-- NOTE: about_text, event_sections, speakers, partners are intentionally NOT
--       synced in the seed upsert so admin edits are preserved on re-run.
-- NOTE: booked_seats is intentionally NOT updated here
--       so existing registrations count is preserved.
-- ────────────────────────────────────────────────────────────
-- Utility queries (run manually as needed):
--
-- Fix drifted seat count:
--   SELECT sync_booked_seats();
--
-- Check current event status:
--   SELECT title, total_seats, booked_seats FROM event;
--
-- Check registrations:
--   SELECT COUNT(*) FROM registrations;
-- ────────────────────────────────────────────────────────────

-- ────────────────────────────────────────────────────────────
-- Trigger: Auto-Sync Booked Seats
-- Automatically updates the booked_seats count whenever a 
-- registration is inserted or deleted, preventing any desync
-- even when dropping rows manually through the Supabase UI.
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trg_sync_booked_seats()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    UPDATE event SET booked_seats = (SELECT COUNT(*) FROM registrations);
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_seats ON registrations;
CREATE TRIGGER trigger_sync_seats
AFTER INSERT OR DELETE ON registrations
FOR EACH STATEMENT
EXECUTE FUNCTION trg_sync_booked_seats();

-- 🔥 IMPORTANT: FORCE SYNC BOOKED_SEATS NOW 🔥
-- This will fix any mismatched "booked seats are still full" issue immediately 
-- the moment you paste this code.
SELECT sync_booked_seats();