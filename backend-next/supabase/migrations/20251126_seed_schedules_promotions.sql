-- Seed data for dentist schedules and promotions
-- Run in Supabase SQL Editor

-- =============================================
-- DENTIST SCHEDULES
-- Each doctor works Mon-Sat, 9AM-6PM with 12-1PM break
-- =============================================

-- Get doctor IDs (assuming they exist)
-- Dr. Ana Reyes schedules
INSERT INTO schedules (id, doctor_id, day_of_week, start_time, end_time, created_at) VALUES
('sch_ana_mon', (SELECT id FROM doctors WHERE name ILIKE '%Ana Reyes%' LIMIT 1), 'Monday', '09:00', '18:00', NOW()),
('sch_ana_tue', (SELECT id FROM doctors WHERE name ILIKE '%Ana Reyes%' LIMIT 1), 'Tuesday', '09:00', '18:00', NOW()),
('sch_ana_wed', (SELECT id FROM doctors WHERE name ILIKE '%Ana Reyes%' LIMIT 1), 'Wednesday', '09:00', '18:00', NOW()),
('sch_ana_thu', (SELECT id FROM doctors WHERE name ILIKE '%Ana Reyes%' LIMIT 1), 'Thursday', '09:00', '18:00', NOW()),
('sch_ana_fri', (SELECT id FROM doctors WHERE name ILIKE '%Ana Reyes%' LIMIT 1), 'Friday', '09:00', '18:00', NOW()),
('sch_ana_sat', (SELECT id FROM doctors WHERE name ILIKE '%Ana Reyes%' LIMIT 1), 'Saturday', '09:00', '15:00', NOW())
ON CONFLICT (id) DO NOTHING;

-- Dr. Carlos Santos schedules
INSERT INTO schedules (id, doctor_id, day_of_week, start_time, end_time, created_at) VALUES
('sch_carlos_mon', (SELECT id FROM doctors WHERE name ILIKE '%Carlos Santos%' LIMIT 1), 'Monday', '09:00', '18:00', NOW()),
('sch_carlos_tue', (SELECT id FROM doctors WHERE name ILIKE '%Carlos Santos%' LIMIT 1), 'Tuesday', '09:00', '18:00', NOW()),
('sch_carlos_wed', (SELECT id FROM doctors WHERE name ILIKE '%Carlos Santos%' LIMIT 1), 'Wednesday', '09:00', '18:00', NOW()),
('sch_carlos_thu', (SELECT id FROM doctors WHERE name ILIKE '%Carlos Santos%' LIMIT 1), 'Thursday', '09:00', '18:00', NOW()),
('sch_carlos_fri', (SELECT id FROM doctors WHERE name ILIKE '%Carlos Santos%' LIMIT 1), 'Friday', '09:00', '18:00', NOW()),
('sch_carlos_sat', (SELECT id FROM doctors WHERE name ILIKE '%Carlos Santos%' LIMIT 1), 'Saturday', '09:00', '15:00', NOW())
ON CONFLICT (id) DO NOTHING;

-- Dr. Maria Cruz schedules
INSERT INTO schedules (id, doctor_id, day_of_week, start_time, end_time, created_at) VALUES
('sch_maria_mon', (SELECT id FROM doctors WHERE name ILIKE '%Maria Cruz%' LIMIT 1), 'Monday', '09:00', '18:00', NOW()),
('sch_maria_tue', (SELECT id FROM doctors WHERE name ILIKE '%Maria Cruz%' LIMIT 1), 'Tuesday', '09:00', '18:00', NOW()),
('sch_maria_wed', (SELECT id FROM doctors WHERE name ILIKE '%Maria Cruz%' LIMIT 1), 'Wednesday', '09:00', '18:00', NOW()),
('sch_maria_thu', (SELECT id FROM doctors WHERE name ILIKE '%Maria Cruz%' LIMIT 1), 'Thursday', '09:00', '18:00', NOW()),
('sch_maria_fri', (SELECT id FROM doctors WHERE name ILIKE '%Maria Cruz%' LIMIT 1), 'Friday', '09:00', '18:00', NOW()),
('sch_maria_sat', (SELECT id FROM doctors WHERE name ILIKE '%Maria Cruz%' LIMIT 1), 'Saturday', '09:00', '15:00', NOW())
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- PROMOTIONS
-- 2 active promotions for testing
-- =============================================

INSERT INTO promotions (id, title, description, discount, original_price, promo_price, valid_until, active, created_at) VALUES
(
  'promo_teeth_whitening',
  'Holiday Teeth Whitening Special',
  'Get a brighter smile this holiday season! Professional teeth whitening at 30% off. Limited time offer - book now and shine bright!',
  '30%',
  '₱5,000',
  '₱3,500',
  '2025-12-31',
  true,
  NOW()
),
(
  'promo_dental_checkup',
  'New Patient Welcome Package',
  'First-time patients get a FREE dental consultation + 20% off on any dental procedure. Includes comprehensive oral examination and X-ray.',
  '20%',
  '₱1,500',
  '₱500',
  '2025-12-31',
  true,
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  discount = EXCLUDED.discount,
  original_price = EXCLUDED.original_price,
  promo_price = EXCLUDED.promo_price,
  valid_until = EXCLUDED.valid_until,
  active = EXCLUDED.active;

-- Verify the data
SELECT 'Schedules created:' as info, COUNT(*) as count FROM schedules;
SELECT 'Promotions created:' as info, COUNT(*) as count FROM promotions;

