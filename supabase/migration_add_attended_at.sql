-- ============================================================
-- Migration: Add attended_at column to registrations table
-- Run this in Supabase SQL Editor → click RUN
-- Safe to re-run: uses ADD COLUMN IF NOT EXISTS
-- ============================================================

-- Add attended_at column for event-day attendance tracking
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS attended_at TIMESTAMPTZ DEFAULT NULL;

-- Verify the column now exists (should show attended_at in the result):
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'registrations'
  AND column_name = 'attended_at';
