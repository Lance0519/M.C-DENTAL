-- Fix Admin Password
-- Run this in Supabase SQL Editor to fix the admin login

-- Update admin password to plain text (the system uses plain text comparison)
UPDATE users 
SET password_hash = 'Admin@123' 
WHERE username = 'admin';

-- If the admin doesn't exist, insert it
INSERT INTO users (id, username, email, password_hash, role, full_name) 
VALUES ('admin001', 'admin', 'admin@mcdental.com', 'Admin@123', 'admin', 'System Administrator')
ON CONFLICT (id) DO UPDATE SET password_hash = 'Admin@123';

-- Verify the admin exists
SELECT id, username, email, role, full_name FROM users WHERE username = 'admin';

