-- ─────────────────────────────────────────────────────────────────
-- Migrazione DB per Milestone 11.2: Sistema di Reschedule
-- ─────────────────────────────────────────────────────────────────
-- Esegui questo script nel SQL Editor della dashboard di Supabase.

ALTER TABLE lessons 
ADD COLUMN IF NOT EXISTS reschedule_requested BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS reschedule_notes TEXT;
