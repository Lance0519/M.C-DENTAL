-- Change schedules.day_of_week from INTEGER to TEXT to match API usage
-- Drop the check constraint first
ALTER TABLE schedules DROP CONSTRAINT IF EXISTS schedules_day_of_week_check;

-- Change the column type
ALTER TABLE schedules ALTER COLUMN day_of_week TYPE TEXT;

-- (Optional) If we wanted to re-add a check constraint for string days:
-- ALTER TABLE schedules ADD CONSTRAINT schedules_day_of_week_check CHECK (day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'));
