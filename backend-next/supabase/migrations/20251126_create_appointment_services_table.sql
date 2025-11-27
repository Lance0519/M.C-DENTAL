-- Create appointment_services table to track services and prices for each appointment
CREATE TABLE IF NOT EXISTS appointment_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id VARCHAR(255) NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  service_id VARCHAR(255) NOT NULL,
  service_name VARCHAR(255),
  price DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_appointment_services_appointment_id ON appointment_services(appointment_id);
CREATE INDEX IF NOT EXISTS idx_appointment_services_service_id ON appointment_services(service_id);

-- Add comment for documentation
COMMENT ON TABLE appointment_services IS 'Tracks services and their prices for each appointment. Supports multiple services per appointment.';

