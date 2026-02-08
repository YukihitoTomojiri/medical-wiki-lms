-- Physical deletion of all PAID_LEAVE and ATTENDANCE_REQUEST records for user 'honkan001'
-- This is a force cleanup operation to completely reset test data for this user.

DELETE FROM paid_leaves
WHERE user_id = (SELECT id FROM users WHERE employee_id = 'honkan001');

DELETE FROM attendance_requests
WHERE user_id = (SELECT id FROM users WHERE employee_id = 'honkan001');

-- Reset cache/persistence context might be needed if application is running.
-- This script ensures the database state is clean.
