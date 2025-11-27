-- M.C. Dental Clinic - Clean Install Script
-- Matches the backend API expectations

-- =====================
-- DROP ALL EXISTING TABLES
-- =====================
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS patient_images CASCADE;
DROP TABLE IF EXISTS medical_history CASCADE;
DROP TABLE IF EXISTS appointment_services CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS schedules CASCADE;
DROP TABLE IF EXISTS promotions CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;
DROP TABLE IF EXISTS staff CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- =====================
-- USERS TABLE (for authentication)
-- =====================
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('patient', 'staff', 'admin')),
  full_name TEXT,
  phone TEXT,
  address TEXT,
  profile_image_url TEXT,
  profile_image_path TEXT,
  reset_token TEXT,
  reset_token_expires TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- PATIENTS TABLE (with login credentials)
-- =====================
CREATE TABLE patients (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  username TEXT UNIQUE,
  password TEXT,
  email TEXT,
  full_name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  date_of_birth DATE,
  gender TEXT,
  role TEXT DEFAULT 'patient',
  profile_image_url TEXT,
  profile_image_path TEXT,
  reset_token TEXT,
  reset_token_expires TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- STAFF TABLE (with login credentials)
-- =====================
CREATE TABLE staff (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  username TEXT UNIQUE,
  password TEXT,
  email TEXT,
  full_name TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  role TEXT DEFAULT 'staff' CHECK (role IN ('staff', 'admin')),
  profile_image_url TEXT,
  profile_image_path TEXT,
  reset_token TEXT,
  reset_token_expires TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- DOCTORS TABLE
-- =====================
CREATE TABLE doctors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  specialization TEXT,
  email TEXT,
  phone TEXT,
  profile_image_url TEXT,
  profile_image_path TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- SERVICES TABLE
-- =====================
CREATE TABLE services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  duration TEXT,
  price TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- PROMOTIONS TABLE
-- =====================
CREATE TABLE promotions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  discount_percentage INTEGER,
  valid_from DATE,
  valid_until DATE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- SCHEDULES TABLE
-- =====================
CREATE TABLE schedules (
  id TEXT PRIMARY KEY,
  doctor_id TEXT REFERENCES doctors(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- APPOINTMENTS TABLE
-- =====================
CREATE TABLE appointments (
  id TEXT PRIMARY KEY,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id TEXT REFERENCES doctors(id) ON DELETE SET NULL,
  service_id TEXT REFERENCES services(id) ON DELETE SET NULL,
  service_name TEXT,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'cancellation_requested', 'reschedule_requested')),
  notes TEXT,
  cancellation_reason TEXT,
  cancellation_requested_at TIMESTAMPTZ,
  reschedule_requested_date DATE,
  reschedule_requested_time TIME,
  reschedule_reason TEXT,
  reschedule_requested_at TIMESTAMPTZ,
  payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
  payment_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- APPOINTMENT SERVICES
-- =====================
CREATE TABLE appointment_services (
  id TEXT PRIMARY KEY,
  appointment_id TEXT REFERENCES appointments(id) ON DELETE CASCADE,
  service_id TEXT REFERENCES services(id) ON DELETE CASCADE,
  service_name TEXT,
  price TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- MEDICAL HISTORY TABLE
-- =====================
CREATE TABLE medical_history (
  id TEXT PRIMARY KEY,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id TEXT REFERENCES appointments(id) ON DELETE SET NULL,
  diagnosis TEXT,
  treatment TEXT,
  notes TEXT,
  images TEXT[],
  visit_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- PATIENT IMAGES TABLE
-- =====================
CREATE TABLE patient_images (
  id TEXT PRIMARY KEY,
  patient_id TEXT REFERENCES patients(id) ON DELETE CASCADE,
  medical_history_id TEXT REFERENCES medical_history(id) ON DELETE SET NULL,
  image_url TEXT NOT NULL,
  image_path TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  uploaded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- NOTIFICATIONS TABLE
-- =====================
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- AUDIT LOGS TABLE
-- =====================
CREATE TABLE audit_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  user_id TEXT,
  user_name TEXT,
  user_role TEXT,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- INDEXES
-- =====================
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_patients_username ON patients(username);
CREATE INDEX idx_patients_email ON patients(email);
CREATE INDEX idx_staff_username ON staff(username);
CREATE INDEX idx_staff_email ON staff(email);
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- =====================
-- SEED DATA - DOCTORS
-- =====================
INSERT INTO doctors (id, name, specialization, email, phone, active) VALUES
  ('doc001', 'Dr. Maria Santos', 'General Dentistry', 'maria.santos@mcdental.com', '09171234567', true),
  ('doc002', 'Dr. Juan Dela Cruz', 'Orthodontics', 'juan.delacruz@mcdental.com', '09181234567', true),
  ('doc003', 'Dr. Ana Reyes', 'Pediatric Dentistry', 'ana.reyes@mcdental.com', '09191234567', true);

-- =====================
-- SEED DATA - SERVICES
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
  ('srv010', 'Dental X-Ray', 'Digital dental X-ray imaging', '15 minutes', '300', true);

-- =====================
-- SEED DATA - SCHEDULES
-- =====================
INSERT INTO schedules (id, doctor_id, day_of_week, start_time, end_time, is_available) VALUES
  ('sch001', 'doc001', 1, '09:00', '17:00', true),
  ('sch002', 'doc001', 2, '09:00', '17:00', true),
  ('sch003', 'doc001', 3, '09:00', '17:00', true),
  ('sch004', 'doc001', 4, '09:00', '17:00', true),
  ('sch005', 'doc001', 5, '09:00', '17:00', true),
  ('sch006', 'doc001', 6, '09:00', '12:00', true),
  ('sch007', 'doc002', 1, '10:00', '18:00', true),
  ('sch008', 'doc002', 2, '10:00', '18:00', true),
  ('sch009', 'doc002', 3, '10:00', '18:00', true),
  ('sch010', 'doc002', 4, '10:00', '18:00', true),
  ('sch011', 'doc002', 5, '10:00', '18:00', true),
  ('sch012', 'doc003', 1, '08:00', '16:00', true),
  ('sch013', 'doc003', 2, '08:00', '16:00', true),
  ('sch014', 'doc003', 3, '08:00', '16:00', true),
  ('sch015', 'doc003', 4, '08:00', '16:00', true),
  ('sch016', 'doc003', 5, '08:00', '16:00', true),
  ('sch017', 'doc003', 6, '08:00', '12:00', true);

-- =====================
-- SEED DATA - PROMOTIONS
-- =====================
INSERT INTO promotions (id, title, description, discount_percentage, valid_from, valid_until, active) VALUES
  ('promo001', 'New Patient Special', 'Get 20% off on your first dental cleaning!', 20, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', true),
  ('promo002', 'Holiday Whitening Promo', 'Brighten your smile this holiday season - 15% off teeth whitening', 15, CURRENT_DATE, CURRENT_DATE + INTERVAL '60 days', true),
  ('promo003', 'Family Package', 'Book for 3 or more family members and get 10% off', 10, CURRENT_DATE, CURRENT_DATE + INTERVAL '90 days', true);

-- =====================
-- SEED DATA - DEFAULT ADMIN STAFF
-- =====================
INSERT INTO staff (id, username, password, email, full_name, role) VALUES
  ('staff001', 'admin', 'Admin@123', 'admin@mcdental.com', 'System Administrator', 'admin');

-- =====================
-- DONE!
-- =====================
SELECT 'Database setup complete! Tables created with correct structure.' as result;
