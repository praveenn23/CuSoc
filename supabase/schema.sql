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
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  singleton    BOOLEAN     NOT NULL DEFAULT TRUE,   -- enforces single-row table
  title        TEXT        NOT NULL,
  description  TEXT,
  date         TIMESTAMPTZ NOT NULL,
  time         TEXT,                                -- display string e.g. "9:30 AM – 4:30 PM IST"
  venue        TEXT        NOT NULL,
  total_seats  INTEGER     NOT NULL DEFAULT 100 CHECK (total_seats > 0),
  booked_seats INTEGER     NOT NULL DEFAULT 0   CHECK (booked_seats >= 0),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Unique index on singleton: only 1 row with singleton=TRUE can ever exist
CREATE UNIQUE INDEX IF NOT EXISTS event_singleton_idx ON event (singleton);

-- ────────────────────────────────────────────────────────────
-- Table: registrations
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS registrations (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT        NOT NULL,
  email      TEXT        NOT NULL UNIQUE,   -- one registration per email
  phone      TEXT        NOT NULL,
  course     TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fast email lookups (duplicate check, OTP match)
CREATE INDEX IF NOT EXISTS idx_registrations_email ON registrations(email);

-- ────────────────────────────────────────────────────────────
-- Table: otp_verifications
-- ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS otp_verifications (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  email      TEXT        NOT NULL,
  otp        TEXT        NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fast OTP lookups
CREATE INDEX IF NOT EXISTS idx_otp_email ON otp_verifications(email);

-- ────────────────────────────────────────────────────────────
-- Function: increment_booked_seats
-- Called on successful registration (race-condition safe)
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_booked_seats(event_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE event
  SET    booked_seats = booked_seats + 1
  WHERE  id = event_id
    AND  booked_seats < total_seats;  -- prevents over-booking

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event is full or not found: %', event_id;
  END IF;
END;
$$;

-- ────────────────────────────────────────────────────────────
-- Function: decrement_booked_seats
-- Called when admin deletes a registration (floored at 0)
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION decrement_booked_seats()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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
CREATE OR REPLACE FUNCTION sync_booked_seats()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE event
  SET booked_seats = (SELECT COUNT(*) FROM registrations);
END;
$$;

-- ────────────────────────────────────────────────────────────
-- Row Level Security (RLS)
-- ────────────────────────────────────────────────────────────
ALTER TABLE event             ENABLE ROW LEVEL SECURITY;
ALTER TABLE registrations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;

-- ── event policies ──────────────────────────────────────────

-- Anyone can read the event (public landing page)
DROP POLICY IF EXISTS "Public can read event" ON event;
CREATE POLICY "Public can read event"
  ON event FOR SELECT
  TO anon, authenticated
  USING (true);

-- Only service_role (backend) can modify the event row
DROP POLICY IF EXISTS "Service role manages event" ON event;
CREATE POLICY "Service role manages event"
  ON event FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── registrations policies ──────────────────────────────────

-- Only backend (service_role) can read/write registrations
DROP POLICY IF EXISTS "Service role manages registrations" ON registrations;
CREATE POLICY "Service role manages registrations"
  ON registrations FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── otp_verifications policies ──────────────────────────────

-- Only backend (service_role) can read/write OTPs
DROP POLICY IF EXISTS "Service role manages OTPs" ON otp_verifications;
CREATE POLICY "Service role manages OTPs"
  ON otp_verifications FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ────────────────────────────────────────────────────────────
-- Seed: Insert or Update your event details
-- ON CONFLICT (singleton) DO UPDATE = upsert pattern.
-- Re-running this script updates event details but PRESERVES
-- booked_seats so you don't lose registration count.
-- ────────────────────────────────────────────────────────────
INSERT INTO event (singleton, title, description, date, time, venue, total_seats, booked_seats)
VALUES (
  TRUE,
  'CuSOC: An Open Source Awareness Session',
  'Join us for an intensive, hands-on workshop on learning to contribute to real-world applications. This event is designed for students and developers who want to harness the knowledge of open source. Spaces are strictly limited.',
  '2026-03-06 09:30:00+05:30',
  '09:30 AM – 04:30 PM IST',
  'D1-Auditorium, Chandigarh University, Mohali, Punjab',
  300,
  0
)
ON CONFLICT (singleton) DO UPDATE
  SET title       = EXCLUDED.title,
      description = EXCLUDED.description,
      date        = EXCLUDED.date,
      time        = EXCLUDED.time,
      venue       = EXCLUDED.venue,
      total_seats = EXCLUDED.total_seats;
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
