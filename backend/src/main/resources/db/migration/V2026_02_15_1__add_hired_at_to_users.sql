-- Add hired_at column to users table for paid leave calculation
ALTER TABLE users ADD COLUMN hired_at DATE NULL;

-- Set default hired_at for existing users (using joined_date or current_date if NULL)
UPDATE users SET hired_at = COALESCE(joined_date, CURRENT_DATE) WHERE hired_at IS NULL;

-- Make hired_at NOT NULL after setting defaults
ALTER TABLE users MODIFY COLUMN hired_at DATE NOT NULL;
