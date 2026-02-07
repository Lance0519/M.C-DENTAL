-- Force update all days to standard business hours
UPDATE clinic_schedule 
SET 
  is_open = true, 
  start_time = '09:00', 
  end_time = '17:00', 
  break_start_time = '12:01', 
  break_end_time = '12:59' 
WHERE day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday');

UPDATE clinic_schedule 
SET 
  is_open = false, 
  start_time = '09:00', 
  end_time = '17:00', 
  break_start_time = '12:01', 
  break_end_time = '12:59' 
WHERE day_of_week = 'Sunday';
