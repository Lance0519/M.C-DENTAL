-- Add string fields to promotions table for frontend compatibility
-- These fields store price and discount information as strings

-- Add discount as TEXT (in addition to discount_percentage INTEGER)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'promotions' AND column_name = 'discount'
  ) THEN
    ALTER TABLE promotions ADD COLUMN discount TEXT;
  END IF;
END $$;

-- Add original_price as TEXT
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'promotions' AND column_name = 'original_price'
  ) THEN
    ALTER TABLE promotions ADD COLUMN original_price TEXT;
  END IF;
END $$;

-- Add promo_price as TEXT
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'promotions' AND column_name = 'promo_price'
  ) THEN
    ALTER TABLE promotions ADD COLUMN promo_price TEXT;
  END IF;
END $$;

-- Add price as TEXT (for compatibility)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'promotions' AND column_name = 'price'
  ) THEN
    ALTER TABLE promotions ADD COLUMN price TEXT;
  END IF;
END $$;

-- Note: duration is intentionally NOT added as per user request

