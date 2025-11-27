-- Add profile_image columns to users and patients tables if they don't exist

-- For users table (staff/admin)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'profile_image'
  ) THEN
    ALTER TABLE users ADD COLUMN profile_image TEXT;
  END IF;
END $$;

-- For patients table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'patients' AND column_name = 'profile_image'
  ) THEN
    ALTER TABLE patients ADD COLUMN profile_image TEXT;
  END IF;
END $$;

-- Add job_title column to users table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'job_title'
  ) THEN
    ALTER TABLE users ADD COLUMN job_title TEXT;
  END IF;
END $$;

