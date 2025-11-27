-- Add payment_amount and completed_at columns to appointments table
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(10, 2);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Add comment for documentation
COMMENT ON COLUMN appointments.payment_amount IS 'The amount paid by the patient for this appointment';
COMMENT ON COLUMN appointments.completed_at IS 'Timestamp when the appointment was marked as completed';

