-- M.C. Dental Clinic - Seed Data
-- Run this AFTER the initial schema

-- =====================
-- SAMPLE DOCTORS
-- =====================
INSERT INTO doctors (id, name, specialization, email, phone, active) VALUES
  ('doc001', 'Dr. Maria Santos', 'General Dentistry', 'maria.santos@mcdental.com', '09171234567', true),
  ('doc002', 'Dr. Juan Dela Cruz', 'Orthodontics', 'juan.delacruz@mcdental.com', '09181234567', true),
  ('doc003', 'Dr. Ana Reyes', 'Pediatric Dentistry', 'ana.reyes@mcdental.com', '09191234567', true)
ON CONFLICT (id) DO NOTHING;

-- =====================
-- SAMPLE SERVICES
-- =====================
INSERT INTO services (id, name, description, duration, price, active) VALUES
  ('srv001', 'Dental Cleaning', 'Professional teeth cleaning and polishing', '30 minutes', '500', true),
  ('srv002', 'Tooth Extraction', 'Safe and painless tooth removal', '45 minutes', '1500', true),
  ('srv003', 'Dental Filling', 'Restore damaged teeth with quality fillings', '30 minutes', '800', true),
  ('srv004', 'Root Canal Treatment', 'Save infected teeth with root canal therapy', '60 minutes', '5000', true),
  ('srv005', 'Teeth Whitening', 'Professional teeth whitening for a brighter smile', '45 minutes', '3000', true),
  ('srv006', 'Dental Braces', 'Orthodontic treatment for teeth alignment', '60 minutes', '35000', true),
  ('srv007', 'Dental Crown', 'Custom-made dental crowns for damaged teeth', '60 minutes', '8000', true),
  ('srv008', 'Dental Implant', 'Permanent tooth replacement solution', '90 minutes', '45000', true),
  ('srv009', 'Wisdom Tooth Extraction', 'Safe removal of wisdom teeth', '60 minutes', '3500', true),
  ('srv010', 'Dental X-Ray', 'Digital dental X-ray imaging', '15 minutes', '300', true)
ON CONFLICT (id) DO NOTHING;

-- =====================
-- SAMPLE SCHEDULES (Mon-Sat for each doctor)
-- =====================
-- Dr. Maria Santos (doc001)
INSERT INTO schedules (id, doctor_id, day_of_week, start_time, end_time, is_available) VALUES
  ('sch001', 'doc001', 1, '09:00', '17:00', true),
  ('sch002', 'doc001', 2, '09:00', '17:00', true),
  ('sch003', 'doc001', 3, '09:00', '17:00', true),
  ('sch004', 'doc001', 4, '09:00', '17:00', true),
  ('sch005', 'doc001', 5, '09:00', '17:00', true),
  ('sch006', 'doc001', 6, '09:00', '12:00', true)
ON CONFLICT (id) DO NOTHING;

-- Dr. Juan Dela Cruz (doc002)
INSERT INTO schedules (id, doctor_id, day_of_week, start_time, end_time, is_available) VALUES
  ('sch007', 'doc002', 1, '10:00', '18:00', true),
  ('sch008', 'doc002', 2, '10:00', '18:00', true),
  ('sch009', 'doc002', 3, '10:00', '18:00', true),
  ('sch010', 'doc002', 4, '10:00', '18:00', true),
  ('sch011', 'doc002', 5, '10:00', '18:00', true)
ON CONFLICT (id) DO NOTHING;

-- Dr. Ana Reyes (doc003)
INSERT INTO schedules (id, doctor_id, day_of_week, start_time, end_time, is_available) VALUES
  ('sch012', 'doc003', 1, '08:00', '16:00', true),
  ('sch013', 'doc003', 2, '08:00', '16:00', true),
  ('sch014', 'doc003', 3, '08:00', '16:00', true),
  ('sch015', 'doc003', 4, '08:00', '16:00', true),
  ('sch016', 'doc003', 5, '08:00', '16:00', true),
  ('sch017', 'doc003', 6, '08:00', '12:00', true)
ON CONFLICT (id) DO NOTHING;

-- =====================
-- SAMPLE PROMOTIONS
-- =====================
INSERT INTO promotions (id, title, description, discount_percentage, valid_from, valid_until, active) VALUES
  ('promo001', 'New Patient Special', 'Get 20% off on your first dental cleaning!', 20, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', true),
  ('promo002', 'Holiday Whitening Promo', 'Brighten your smile this holiday season - 15% off teeth whitening', 15, CURRENT_DATE, CURRENT_DATE + INTERVAL '60 days', true),
  ('promo003', 'Family Package', 'Book for 3 or more family members and get 10% off', 10, CURRENT_DATE, CURRENT_DATE + INTERVAL '90 days', true)
ON CONFLICT (id) DO NOTHING;

-- =====================
-- CREATE DEFAULT ADMIN USER
-- Password: Admin@123
-- =====================
INSERT INTO users (id, username, email, password_hash, role, full_name) VALUES
  ('admin001', 'admin', 'admin@mcdental.com', 'Admin@123', 'admin', 'System Administrator')
ON CONFLICT (id) DO NOTHING;

-- =====================
-- SUCCESS MESSAGE
-- =====================
SELECT 'Seed data inserted successfully!' as message;

