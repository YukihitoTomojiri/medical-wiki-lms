import { describe, it, expect } from 'vitest';

const API_BASE = process.env.VITE_API_URL || 'http://localhost:8080/api';

describe('Backend Admin API Security', () => {
    // Note: These tests assume the backend is running and has seed data.
    // User 1 is 'dev' (DEVELOPER)
    // User 2 is 'admin' (ADMIN)
    // User 3 is 'honkan001' (USER)

    it('should allow access to admin logs for DEVELOPER role', async () => {
        const res = await fetch(`${API_BASE}/admin/logs`, {
            headers: { 'X-User-Id': '1' }
        });
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(Array.isArray(data)).toBe(true);
    });

    it('should deny access to admin logs for ADMIN role', async () => {
        const res = await fetch(`${API_BASE}/admin/logs`, {
            headers: { 'X-User-Id': '2' }
        });
        expect(res.status).toBe(403);
    });

    it('should deny access to admin logs for USER role', async () => {
        const res = await fetch(`${API_BASE}/admin/logs`, {
            headers: { 'X-User-Id': '3' }
        });
        expect(res.status).toBe(403);
    });

    it('should deny access to admin logs for anonymous requests', async () => {
        const res = await fetch(`${API_BASE}/admin/logs`);
        expect(res.status).toBe(403);
    });

    describe('User Registration Security', () => {
        it('should return error when registering a user with duplicate employeeId', async () => {
            // 'dev' user has employeeId 'dev' and ID 1
            const duplicateUser = {
                employeeId: 'dev',
                name: 'Duplicate Test',
                password: 'password123',
                facility: '本館',
                department: '事務部',
                role: 'USER'
            };

            const res = await fetch(`${API_BASE}/admin/users/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': '1' // Using dev user as executor
                },
                body: JSON.stringify(duplicateUser)
            });

            expect(res.status).toBe(400);
            const data = await res.json();
            expect(data.message).toContain('既に登録されています');
        });
    });
});
