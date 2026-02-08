-- Logical deletion of all PAID_LEAVE records for user 'honkan001'
-- This is a maintenance operation to clean up test data.

UPDATE paid_leaves
SET deleted_at = NOW()
WHERE user_id = (SELECT id FROM users WHERE employee_id = 'honkan001');

-- Ensure no impact on user_facility_mapping or other tables as requested.
