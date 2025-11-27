-- Add gender column to patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS gender VARCHAR(50);

-- Add comment for documentation
COMMENT ON COLUMN patients.gender IS 'Patient gender (Male, Female, Other, Prefer not to say)';

