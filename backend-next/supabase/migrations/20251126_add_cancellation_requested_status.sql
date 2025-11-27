-- Add 'cancellation_requested' to the appointments status check constraint
-- Run with: psql "$SUPABASE_DB_URL" -f 20251126_add_cancellation_requested_status.sql

-- Drop the existing check constraint
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;

-- Add the new check constraint with 'cancellation_requested' included
ALTER TABLE appointments ADD CONSTRAINT appointments_status_check 
  CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'cancellation_requested'));

