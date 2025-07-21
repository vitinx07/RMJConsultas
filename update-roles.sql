
-- Update all users with role 'vendedor' to 'operador'
UPDATE users SET role = 'operador' WHERE role = 'vendedor';

-- Verify the update
SELECT id, username, role FROM users WHERE role = 'operador';
