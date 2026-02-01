import { User, Manual, Progress, UserProgress, LoginRequest, LoginResponse, UserUpdateRequest, UserCreateRequest } from './types';

const API_BASE = '/api';

const getHeaders = (userId?: number): HeadersInit => {
    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };
    if (userId) {
        headers['X-User-Id'] = userId.toString();
    }
    return headers;
};

export const api = {
    // Auth
    login: async (request: LoginRequest): Promise<LoginResponse> => {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(request),
        });
        return res.json();
    },

    changePassword: async (userId: number, newPassword: string): Promise<any> => {
        const res = await fetch(`${API_BASE}/auth/change-password`, {
            method: 'POST',
            headers: getHeaders(userId),
            body: JSON.stringify({ userId, newPassword }),
        });
        return res.json();
    },

    setupAccount: async (token: string, password: string): Promise<any> => {
        const res = await fetch(`${API_BASE}/auth/setup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, password }),
        });
        return res.json();
    },
    forgotPassword: async (email: string): Promise<any> => {
        const res = await fetch(`${API_BASE}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });
        return res.json();
    },
    resetPassword: async (token: string, password: string): Promise<any> => {
        const res = await fetch(`${API_BASE}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, password }),
        });
        return res.json();
    },


    // Manuals
    getManuals: async (userId: number, category?: string): Promise<Manual[]> => {
        const url = category
            ? `${API_BASE}/manuals?category=${encodeURIComponent(category)}`
            : `${API_BASE}/manuals`;
        const res = await fetch(url, { headers: getHeaders(userId) });
        return res.json();
    },

    getManual: async (userId: number, id: number): Promise<Manual> => {
        const res = await fetch(`${API_BASE}/manuals/${id}`, {
            headers: getHeaders(userId)
        });
        return res.json();
    },

    getCategories: async (): Promise<string[]> => {
        const res = await fetch(`${API_BASE}/manuals/categories`);
        return res.json();
    },

    createManual: async (userId: number, data: { title: string; content: string; category: string }): Promise<Manual> => {
        const res = await fetch(`${API_BASE}/manuals`, {
            method: 'POST',
            headers: getHeaders(userId),
            body: JSON.stringify(data),
        });
        return res.json();
    },

    updateManual: async (userId: number, id: number, data: { title: string; content: string; category: string }): Promise<Manual> => {
        const res = await fetch(`${API_BASE}/manuals/${id}`, {
            method: 'PUT',
            headers: getHeaders(userId),
            body: JSON.stringify(data),
        });
        return res.json();
    },

    uploadPdf: async (userId: number, id: number, file: File): Promise<string> => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(`${API_BASE}/manuals/${id}/pdf`, {
            method: 'POST',
            headers: {
                'X-User-Id': userId.toString()
            },
            body: formData,
        });
        return res.text();
    },

    // Progress
    markAsRead: async (userId: number, manualId: number): Promise<Progress> => {
        const res = await fetch(`${API_BASE}/progress/${manualId}`, {
            method: 'POST',
            headers: getHeaders(userId),
        });
        return res.json();
    },

    getMyProgress: async (userId: number): Promise<Progress[]> => {
        const res = await fetch(`${API_BASE}/progress/my`, {
            headers: getHeaders(userId),
        });
        return res.json();
    },

    getAllUsersProgress: async (): Promise<UserProgress[]> => {
        const res = await fetch(`${API_BASE}/progress/admin/all`);
        return res.json();
    },
    // Users
    getUsers: async (userId: number): Promise<User[]> => {
        const res = await fetch(`${API_BASE}/users`, {
            headers: getHeaders(userId),
        });
        return res.json();
    },

    updateUser: async (userId: number, id: number, data: UserUpdateRequest): Promise<User> => {
        const res = await fetch(`${API_BASE}/users/${id}`, {
            method: 'PUT',
            headers: getHeaders(userId),
            body: JSON.stringify(data),
        });
        return res.json();
    },

    // Admin/System
    getDiagnostics: async (userId: number): Promise<any> => {
        const res = await fetch(`${API_BASE}/admin/system/diagnostics`, {
            headers: getHeaders(userId),
        });
        if (!res.ok) return { uptime: 0, memoryTotal: 0, memoryFree: 0, memoryUsed: 0, dbPing: 0 };
        return res.json();
    },

    getLogs: async (userId: number): Promise<any[]> => {
        const res = await fetch(`${API_BASE}/admin/logs`, {
            headers: getHeaders(userId),
        });
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data) ? data : [];
    },

    getAuditLogs: async (userId: number): Promise<any[]> => {
        const res = await fetch(`${API_BASE}/admin/audit-logs`, {
            headers: getHeaders(userId),
        });
        if (!res.ok) return [];
        return res.json();
    },


    bulkDeleteUsers: async (userId: number, ids: number[]): Promise<any> => {
        const res = await fetch(`${API_BASE}/admin/users/bulk-delete`, {
            method: 'POST',
            headers: getHeaders(userId),
            body: JSON.stringify(ids),
        });
        return res.json();
    },

    bulkResetProgress: async (userId: number, ids: number[]): Promise<any> => {
        const res = await fetch(`${API_BASE}/admin/users/bulk-reset-progress`, {
            method: 'POST',
            headers: getHeaders(userId),
            body: JSON.stringify(ids),
        });
        return res.json();
    },

    registerUser: async (userId: number, data: UserCreateRequest): Promise<any> => {
        const res = await fetch(`${API_BASE}/admin/users/register`, {
            method: 'POST',
            headers: getHeaders(userId),
            body: JSON.stringify(data),
        });
        return res.json();
    },

    bulkRegisterUsers: async (userId: number, data: UserCreateRequest[]): Promise<any> => {
        const res = await fetch(`${API_BASE}/admin/users/bulk-register`, {
            method: 'POST',
            headers: getHeaders(userId),
            body: JSON.stringify(data),
        });
        return res.json();
    },

    bulkRegisterUsersV2: async (userId: number, data: { users: UserCreateRequest[], restoreIds: string[] }): Promise<any> => {
        const res = await fetch(`${API_BASE}/admin/users/bulk-register-v2`, {
            method: 'POST',
            headers: getHeaders(userId),
            body: JSON.stringify(data),
        });
        return res.json();
    },

    validateBulkCsv: async (userId: number, data: UserCreateRequest[]): Promise<{
        isValid: boolean;
        errors: string[];
        restorableUsers: any[];
        validNewUsers: any[];
    }> => {
        const res = await fetch(`${API_BASE}/admin/users/validate-csv`, {
            method: 'POST',
            headers: getHeaders(userId),
            body: JSON.stringify(data),
        });
        return res.json();
    },

    restoreUser: async (userId: number, targetId: number): Promise<any> => {
        const res = await fetch(`${API_BASE}/admin/users/${targetId}/restore`, {
            method: 'POST',
            headers: getHeaders(userId),
        });
        return res.json();
    },

    issueTempPassword: async (userId: number, targetUserId: number): Promise<{ tempPassword: string }> => {
        const res = await fetch(`${API_BASE}/users/${targetUserId}/temp-password`, {
            method: 'POST',
            headers: getHeaders(userId),
        });
        return res.json();
    },

    getAllUsersIncludingDeleted: async (userId: number): Promise<any> => {
        const res = await fetch(`${API_BASE}/admin/users/all-including-deleted`, {
            method: 'GET',
            headers: getHeaders(userId),
        });
        return res.json();
    },

    // Compliance Export
    getComplianceFacilities: async (userId: number): Promise<string[]> => {
        const res = await fetch(`${API_BASE}/admin/compliance/facilities`, {
            headers: getHeaders(userId),
        });
        if (!res.ok) return [];
        return res.json();
    },

    exportComplianceCsv: async (userId: number, facility?: string, start?: string, end?: string): Promise<Blob> => {
        const params = new URLSearchParams();
        if (facility && facility !== 'all') params.append('facility', facility);
        if (start) params.append('start', start);
        if (end) params.append('end', end);
        const url = `${API_BASE}/admin/compliance/export/csv${params.toString() ? '?' + params.toString() : ''}`;
        const res = await fetch(url, {
            headers: getHeaders(userId),
        });
        return res.blob();
    },

    exportCompliancePdf: async (userId: number, facility?: string, start?: string, end?: string): Promise<Blob> => {
        const params = new URLSearchParams();
        if (facility && facility !== 'all') params.append('facility', facility);
        if (start) params.append('start', start);
        if (end) params.append('end', end);
        const url = `${API_BASE}/admin/compliance/export/pdf${params.toString() ? '?' + params.toString() : ''}`;
        const res = await fetch(url, {
            headers: getHeaders(userId),
        });
        return res.blob();
    },

    // Security Alerts
    getSecurityAlerts: async (userId: number, openOnly: boolean = false): Promise<any[]> => {
        const url = `${API_BASE}/admin/security/alerts${openOnly ? '?openOnly=true' : ''}`;
        const res = await fetch(url, {
            headers: getHeaders(userId),
        });
        if (!res.ok) return [];
        return res.json();
    },

    getSecurityAlertStats: async (userId: number): Promise<{ totalOpen: number; criticalOpen: number; alerts24h: number }> => {
        const res = await fetch(`${API_BASE}/admin/security/alerts/stats`, {
            headers: getHeaders(userId),
        });
        if (!res.ok) return { totalOpen: 0, criticalOpen: 0, alerts24h: 0 };
        return res.json();
    },

    acknowledgeSecurityAlert: async (userId: number, alertId: number): Promise<any> => {
        const res = await fetch(`${API_BASE}/admin/security/alerts/${alertId}/acknowledge`, {
            method: 'POST',
            headers: getHeaders(userId),
        });
        return res.json();
    },

    resolveSecurityAlert: async (userId: number, alertId: number): Promise<any> => {
        const res = await fetch(`${API_BASE}/admin/security/alerts/${alertId}/resolve`, {
            method: 'POST',
            headers: getHeaders(userId),
        });
        return res.json();
    },
};

