-- Admin password reset and forced change flag
UPDATE users SET password = '$2a$10$8.UnVuG9HHg7uxS9H.2FWuOo7u.m84OmS6H8S8qH0Y40.5z020O6.', must_change_password = 1 WHERE employee_id = 'admin';

-- Ensure all current users have the flag initialized to 0 if NULL, except admin
UPDATE users SET must_change_password = 0 WHERE must_change_password IS NULL AND employee_id != 'admin';

-- Adjust column to have default value for future users
ALTER TABLE users MODIFY COLUMN must_change_password bit(1) NOT NULL DEFAULT 1;
