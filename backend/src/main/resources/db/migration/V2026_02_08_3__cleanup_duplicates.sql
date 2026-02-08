-- Clean up duplicate attendance requests for user honkan001 (user_id=3) on 2026-02-07
-- Keeping ID 5 (APPROVED) as valid, logically deleting others (1, 2, 3, 4, 7)
UPDATE attendance_requests SET deleted_at = NOW() WHERE id IN (1, 2, 3, 4, 7);
