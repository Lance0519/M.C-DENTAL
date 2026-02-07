-- Add 'no-show' status to appointments table
-- This allows appointments to be explicitly marked as no-show

-- First, update any existing pending appointments that are in the past to 'no-show'
-- (Optional: Uncomment if you want to auto-mark past pending appointments)
-- UPDATE appointments 
-- SET status = 'no-show'
-- WHERE status = 'pending' 
--   AND appointment_date < CURRENT_DATE;

-- Drop the existing CHECK constraint
ALTER TABLE appointments 
DROP CONSTRAINT IF EXISTS appointments_status_check;

-- Add the new CHECK constraint with 'no-show' status
ALTER TABLE appointments 
ADD CONSTRAINT appointments_status_check 
CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'cancellation_requested', 'reschedule_requested', 'no-show'));

