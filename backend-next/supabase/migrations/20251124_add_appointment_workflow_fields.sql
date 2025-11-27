-- Adds additional workflow tracking fields for appointments
-- Run with: psql "$SUPABASE_DB_URL" -f 20251124_add_appointment_workflow_fields.sql

ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS reschedule_requested BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS reschedule_requested_date DATE,
  ADD COLUMN IF NOT EXISTS reschedule_requested_time TEXT;

CREATE TABLE IF NOT EXISTS appointment_services (
  id TEXT PRIMARY KEY DEFAULT ('asrv' || floor(random()*1000000000)::text),
  appointment_id TEXT NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  service_id TEXT NOT NULL,
  service_name TEXT,
  price TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appointment_services_appointment_id
  ON appointment_services (appointment_id);

