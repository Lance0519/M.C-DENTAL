-- Create notifications table
-- Run with: psql "$SUPABASE_DB_URL" -f 20251126_create_notifications_table.sql

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY DEFAULT ('notif' || floor(random()*1000000000)::text),
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN (
    'info', 'warning', 'error', 'success',
    'cancellation_request', 'reschedule_request',
    'appointment_confirmed', 'appointment_completed',
    'medical_history_uploaded', 'appointment_rescheduled',
    'cancellation_approved', 'reschedule_approved',
    'cancellation_rejected', 'reschedule_rejected',
    'new_appointment'
  )),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient user-based queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

