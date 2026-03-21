-- ============================================================
-- Supabase SQL Schema — ABHYUTTHANAM: Achievers Awards
-- Registration System
--
-- ✅ SAFE TO RE-RUN:
--    Uses CREATE IF NOT EXISTS, CREATE OR REPLACE,
--    ALTER TABLE ... ADD COLUMN IF NOT EXISTS,
--    DROP POLICY IF EXISTS, and ON CONFLICT DO NOTHING.
--
-- ⚠️  NOTE: Running this on an existing database will NOT
--    overwrite your event details, speakers, or registrations.
--    It only adds missing columns / objects.
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- Extension: UUID generation
-- ────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ────────────────────────────────────────────────────────────
-- TABLE: event
-- Single-row table (enforced via singleton + unique index).
-- All event details are managed via the Admin Panel.
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  singleton     BOOLEAN     NOT NULL DEFAULT TRUE,  -- only 1 row ever allowed
  title         TEXT        NOT NULL,
  description   TEXT,
  date          TIMESTAMPTZ NOT NULL,
  time          TEXT,           -- display string e.g. "9:30 AM – 4:30 PM IST"
  venue         TEXT        NOT NULL,
  total_seats   INTEGER     NOT NULL DEFAULT 100 CHECK (total_seats > 0),
  booked_seats  INTEGER     NOT NULL DEFAULT 0   CHECK (booked_seats >= 0),
  about_text    TEXT,           -- intro paragraph for the public event page
  event_sections JSONB      DEFAULT '[]'::jsonb, -- 3-column content grid
  speakers      JSONB       DEFAULT '[]'::jsonb, -- [{name, role, bio, linkedin, color, initials, photo_url}]
  partners      JSONB       DEFAULT '[]'::jsonb, -- [{name, logo_url}]
  created_at    TIMESTAMPTZ DEFAULT NOW()
);


-- Enforce single-row constraint
CREATE UNIQUE INDEX IF NOT EXISTS event_singleton_idx ON event (singleton);


-- ────────────────────────────────────────────────────────────
-- TABLE: registrations
--
-- New schema for ABHYUTTHANAM multi-category awards form.
-- Each applicant selects 1–6 award categories.
-- All category-specific data is stored in `categories` JSONB.
--
-- Example categories value:
-- [
--   {"type": "research",  "data": {"project_type": "...", "funding_letter_url": "..."}},
--   {"type": "competitions", "data": {"comp_name": "...", "level": "National", ...}}
-- ]
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS registrations (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT        NOT NULL,
  email         TEXT        NOT NULL UNIQUE,  -- one registration per email
  uid           TEXT,                          -- University UID / EID
  cluster       TEXT,
  department    TEXT,
  type          TEXT,                          -- Student | Mentor | Coordinator
  categories    JSONB       DEFAULT '[]'::jsonb, -- structured multi-category data
  -- Timestamps
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  ticket_sent_at TIMESTAMPTZ DEFAULT NULL,
  attended_at   TIMESTAMPTZ DEFAULT NULL
);

-- Safe column additions for existing registrations table
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS uid        TEXT;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS type       TEXT;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS categories JSONB DEFAULT '[]'::jsonb;

-- Index for fast email lookups (duplicate checks, OTP matching)
CREATE INDEX IF NOT EXISTS idx_registrations_email ON registrations(email);


-- ────────────────────────────────────────────────────────────
-- TABLE: otp_verifications
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS otp_verifications (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  email      TEXT        NOT NULL,
  otp        TEXT        NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_verifications(email);


-- ────────────────────────────────────────────────────────────
-- STORAGE: proofs bucket
-- All category file uploads go here (PDFs, images, etc.)
-- ────────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('proofs', 'proofs', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'proofs');

DROP POLICY IF EXISTS "Anon Insert" ON storage.objects;
CREATE POLICY "Anon Insert"
  ON storage.objects FOR INSERT
  TO public
  WITH CHECK (bucket_id = 'proofs');


-- ────────────────────────────────────────────────────────────
-- FUNCTION: increment_booked_seats(event_id)
-- Called on successful registration.
-- Atomic increment — prevents overbooking.
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_booked_seats(event_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE event
  SET booked_seats = booked_seats + 1
  WHERE id = event_id
    AND booked_seats < total_seats;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event is full or not found: %', event_id;
  END IF;
END;
$$;



-- ────────────────────────────────────────────────────────────
-- FUNCTION: sync_booked_seats()
-- Utility — run manually to fix any drift.
-- Usage: SELECT sync_booked_seats();
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION sync_booked_seats()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE event
  SET booked_seats = (SELECT COUNT(*) FROM registrations)
  WHERE singleton = TRUE;
END;
$$;


-- ────────────────────────────────────────────────────────────
-- FUNCTION: find_by_ticket_code(ticket)
-- Used by admin attendance scanner.
-- Ticket code = UPPER(RIGHT(id::text, 4))
-- e.g. UUID "...a1b2c3d4" → ticket code "C3D4"
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION find_by_ticket_code(ticket text)
RETURNS SETOF registrations
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT * FROM registrations
  WHERE UPPER(RIGHT(id::text, 4)) = UPPER(ticket)
  LIMIT 1;
$$;


-- ────────────────────────────────────────────────────────────
-- TRIGGER: auto-sync booked_seats on INSERT or DELETE
--
-- This is the core fix for the "booked seats not updating"
-- bug. Whenever a registration row is inserted or deleted
-- (including manual deletes from the Supabase dashboard),
-- this trigger automatically recomputes booked_seats from
-- the actual COUNT(*) of registrations.
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trg_sync_booked_seats()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE event
  SET booked_seats = (SELECT COUNT(*) FROM registrations)
  WHERE singleton = TRUE;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trigger_sync_seats ON registrations;
CREATE TRIGGER trigger_sync_seats
  AFTER INSERT OR DELETE ON registrations
  FOR EACH STATEMENT
  EXECUTE FUNCTION trg_sync_booked_seats();


-- ────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- ────────────────────────────────────────────────────────────
ALTER TABLE event              ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_verifications  ENABLE ROW LEVEL SECURITY;

-- event: anyone can read (public landing page)
DROP POLICY IF EXISTS "Public can read event" ON event;
CREATE POLICY "Public can read event"
  ON event FOR SELECT
  TO anon, authenticated
  USING (true);

-- event: only service_role (backend) can write
DROP POLICY IF EXISTS "Service role manages event" ON event;
CREATE POLICY "Service role manages event"
  ON event FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- registrations: only service_role (backend) can read/write
DROP POLICY IF EXISTS "Service role manages registrations" ON registrations;
CREATE POLICY "Service role manages registrations"
  ON registrations FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

-- otp_verifications: only service_role (backend) can read/write
DROP POLICY IF EXISTS "Service role manages OTPs" ON otp_verifications;
CREATE POLICY "Service role manages OTPs"
  ON otp_verifications FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);


-- ────────────────────────────────────────────────────────────
-- SEED: Initial event row
--
-- ✅ SAFE: Uses ON CONFLICT DO NOTHING — will NEVER overwrite
--    your existing event details, speakers, sections, or
--    booked_seats when re-running this script.
--
-- Only inserts if the events table is completely empty.
-- ────────────────────────────────────────────────────────────
INSERT INTO event (
  singleton, title, description, date, time, venue,
  total_seats, booked_seats, about_text, event_sections, speakers, partners
) VALUES (
  TRUE,
  'ABHYUTTHANAM: Achievers Awards',
  'Annual recognition ceremony celebrating student and faculty excellence across Research, Innovation, Entrepreneurship, Competitions, Patents, and Leadership.',
  '2026-04-21 09:30:00+05:30',
  '09:30 AM – 04:30 PM IST',
  'D1-Auditorium, Chandigarh University, Mohali, Punjab',
  500,
  0,
  'ABHYUTTHANAM is the annual achievers awards ceremony at Chandigarh University, celebrating outstanding accomplishments of students, mentors, and coordinators across six major award categories.',
  '[]'::jsonb,
  '[]'::jsonb,
  '[]'::jsonb
) ON CONFLICT (singleton) DO NOTHING;

-- NOTE: The DO NOTHING clause ensures this seed data is NEVER
--       applied if an event row already exists. All admin edits
--       made through the Admin Panel are fully preserved.


-- ────────────────────────────────────────────────────────────
-- FORCE SYNC: Fix any existing booked_seats drift
-- Run this immediately to correct any mismatch.
-- ────────────────────────────────────────────────────────────
SELECT sync_booked_seats();
