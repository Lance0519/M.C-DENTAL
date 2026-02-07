-- Create clinic_schedule table if it doesn't exist
CREATE TABLE IF NOT EXISTS clinic_schedule (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week TEXT NOT NULL UNIQUE CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
  is_open BOOLEAN DEFAULT true,
  start_time TIME DEFAULT '09:00',
  end_time TIME DEFAULT '17:00',
  break_start_time TIME DEFAULT '12:01',
  break_end_time TIME DEFAULT '12:59',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add break columns if they don't exist (for existing tables)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clinic_schedule' AND column_name = 'break_start_time'
  ) THEN
    ALTER TABLE clinic_schedule ADD COLUMN break_start_time TIME DEFAULT '12:01';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clinic_schedule' AND column_name = 'break_end_time'
  ) THEN
    ALTER TABLE clinic_schedule ADD COLUMN break_end_time TIME DEFAULT '12:59';
  END IF;
END $$;

-- Seed default schedule if table is empty
INSERT INTO clinic_schedule (day_of_week, is_open, start_time, end_time, break_start_time, break_end_time)
SELECT day, CASE WHEN day = 'Sunday' THEN false ELSE true END, '09:00', '17:00', '12:01', '12:59'
FROM unnest(ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']) AS day
ON CONFLICT (day_of_week) DO UPDATE SET
  start_time = EXCLUDED.start_time,
  end_time = EXCLUDED.end_time,
  break_start_time = EXCLUDED.break_start_time,
  break_end_time = EXCLUDED.break_end_time,
  is_open = EXCLUDED.is_open;
