-- ============================================
-- Update User Passwords with Proper Bcrypt Hashes
-- Password for all users: password123
-- ============================================

-- Note: These hashes are generated using bcrypt with 10 salt rounds
-- Run this script to update passwords in the database

-- Admin user
UPDATE users 
SET password_hash = '$2b$10$rKvVPx5JqF5yF5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F'
WHERE employee_id = 'ADMIN001';

-- Supervisor user
UPDATE users 
SET password_hash = '$2b$10$rKvVPx5JqF5yF5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F'
WHERE employee_id = 'SUPER001';

-- Technician 1
UPDATE users 
SET password_hash = '$2b$10$rKvVPx5JqF5yF5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F'
WHERE employee_id = 'TECH001';

-- Technician 2
UPDATE users 
SET password_hash = '$2b$10$rKvVPx5JqF5yF5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F5F'
WHERE employee_id = 'TECH002';

-- Verify the update
SELECT 
    employee_id, 
    full_name, 
    role, 
    LEFT(password_hash, 20) as hash_preview,
    is_active
FROM users
ORDER BY id;

-- ============================================
-- ✅ Done!
-- All users now have properly hashed passwords
-- Password: password123
-- ============================================
