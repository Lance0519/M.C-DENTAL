-- Add active column to services table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'services' AND column_name = 'active'
  ) THEN
    ALTER TABLE services ADD COLUMN active BOOLEAN DEFAULT TRUE;
  END IF;
END $$;

-- Add active column to promotions table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'promotions' AND column_name = 'active'
  ) THEN
    ALTER TABLE promotions ADD COLUMN active BOOLEAN DEFAULT TRUE;
  END IF;
END $$;

