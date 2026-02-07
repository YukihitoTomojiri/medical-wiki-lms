-- Migration: Add tables for Phase 1 leave/attendance system
-- Run on MySQL 8.0

-- 1. User-Facility Mapping (many-to-many for admin multi-facility access)
CREATE TABLE IF NOT EXISTS user_facility_mapping (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  facility_name VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user_facility_user (user_id),
  INDEX idx_user_facility_name (facility_name)
);

-- 2. Paid Leave Accruals (grant history)
CREATE TABLE IF NOT EXISTS paid_leave_accruals (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NOT NULL,
  days_granted DOUBLE NOT NULL,
  granted_by_id BIGINT NOT NULL,
  reason VARCHAR(255),
  granted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (granted_by_id) REFERENCES users(id),
  INDEX idx_accrual_user (user_id)
);

-- 3. Add leave_type column to paid_leaves (check first, then add if missing)
-- MySQL 8.0 doesn't support ADD COLUMN IF NOT EXISTS, so we use a procedure
-- For safety, this is a simple ALTER that will error if column exists, so run once or check manually
-- ALTER TABLE paid_leaves ADD COLUMN leave_type ENUM('FULL', 'HALF_AM', 'HALF_PM') DEFAULT 'FULL';

-- Alternative: Use a stored procedure to check and add column
DELIMITER //
CREATE PROCEDURE add_leave_type_column()
BEGIN
    IF NOT EXISTS (
        SELECT * FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'paid_leaves' 
        AND COLUMN_NAME = 'leave_type'
    ) THEN
        ALTER TABLE paid_leaves ADD COLUMN leave_type ENUM('FULL', 'HALF_AM', 'HALF_PM') DEFAULT 'FULL';
    END IF;
END //
DELIMITER ;

CALL add_leave_type_column();
DROP PROCEDURE IF EXISTS add_leave_type_column;
