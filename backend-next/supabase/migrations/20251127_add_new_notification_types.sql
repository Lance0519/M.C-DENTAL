-- Add new notification types for patients
-- Run with: psql "$SUPABASE_DB_URL" -f 20251127_add_new_notification_types.sql

-- Drop and recreate the constraint with new types
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications ADD CONSTRAINT notifications_type_check CHECK (type IN (
  'info', 'warning', 'error', 'success',
  'cancellation_request', 'reschedule_request',
  'appointment_confirmed', 'appointment_completed',
  'medical_history_uploaded', 'appointment_rescheduled',
  'cancellation_approved', 'reschedule_approved',
  'cancellation_rejected', 'reschedule_rejected',
  'new_appointment',
  -- New notification types for patients
  'appointment_reminder',
  'new_promotion',
  'patient_document_uploaded'
));

