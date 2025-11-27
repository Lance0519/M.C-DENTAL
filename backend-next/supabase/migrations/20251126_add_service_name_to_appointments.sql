-- Add service_name column to appointments table for better querying
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS service_name VARCHAR(255);

-- Update existing appointments with service names from services table
UPDATE appointments a
SET service_name = s.name
FROM services s
WHERE a.service_id = s.id AND a.service_name IS NULL;

