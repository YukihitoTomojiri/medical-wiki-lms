import { User, Manual, Progress, UserProgress, LoginRequest, LoginResponse, UserUpdateRequest, UserCreateRequest } from './types';

export interface AdminLeaveMonitoring {
    userId: number;
    userName: string;
    employeeId: string;
    facilityName: string;
    joinedDate: string;
    currentPaidLeaveDays: number;
    obligatoryDaysTaken: number;
    obligatoryTarget: number;
    isObligationMet: boolean;
    needsAttention: boolean;
    daysRemainingToObligation: number;
    currentCycleStart: string;
    currentCycleEnd: string;
    baseDate: string;
    targetEndDate: string;
    isViolation: boolean;
}

export interface Announcement {
    id: number;
    title: string;
    content: string;
    priority: 'HIGH' | 'NORMAL' | 'LOW';
    displayUntil: string;
    facilityId?: number;
    createdAt: string;
    relatedWikiId?: number;
    relatedWikiTitle?: string;
    relatedEventId?: number;
    relatedEventTitle?: string;
    relatedType?: 'WIKI' | 'TRAINING_EVENT';
}


export interface TrainingEvent {
    id: number;
    title: string;
    description: string;
    videoUrl?: string;
    videoUrl2?: string;
    videoUrl3?: string;
    materialsUrl?: string;
    targetCommitteeId?: number;
    targetJobType?: string;
    startTime: string;
    endTime: string;
    qrCodeToken?: string;
    createdAt: string;
}

export interface TrainingResponse {
    id: number;
    eventId: number;
    userId: number;
    attendeeName: string;
    answersJson: string;
    attendedAt: string;
}

export interface Committee {
    id: number;
    name: string;
    description: string;
}

const API_BASE = '/api';

const getHeaders = (userId?: number): Record<string, string> => {
    const headers: Record<string, string> = {
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

    changePassword: async (userId: number, currentPassword: string, newPassword: string): Promise<any> => {
        const res = await fetch(`${API_BASE}/auth/change-password`, {
            method: 'POST',
            headers: getHeaders(userId),
            body: JSON.stringify({ userId, currentPassword, newPassword }),
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
    getUsers: async (userId: number, facility?: string): Promise<User[]> => {
        const url = facility && facility !== 'all'
            ? `${API_BASE}/users?facility=${encodeURIComponent(facility)}`
            : `${API_BASE}/users`;
        const res = await fetch(url, {
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

    getDistinctFacilities: async (): Promise<string[]> => {
        const res = await fetch(`${API_BASE}/users/facilities`);
        if (!res.ok) return [];
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

    getSystemResources: async (userId: number): Promise<any> => {
        const res = await fetch(`${API_BASE}/admin/system-resources`, {
            headers: getHeaders(userId),
        });
        if (!res.ok) return null;
        return res.json();
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
        const res = await fetch(`${API_BASE}/users/register`, {
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

    getAllUsersIncludingDeleted: async (userId: number, facility?: string): Promise<any> => {
        const url = facility && facility !== 'all'
            ? `${API_BASE}/admin/users/all-including-deleted?facility=${encodeURIComponent(facility)}`
            : `${API_BASE}/admin/users/all-including-deleted`;
        const res = await fetch(url, {
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
        if (start) params.append('startDate', start);
        if (end) params.append('endDate', end);
        const url = `${API_BASE}/admin/export/compliance${params.toString() ? '?' + params.toString() : ''}`;
        const res = await fetch(url, {
            headers: getHeaders(userId),
        });
        return res.blob();
    },

    remindUser: async (userId: number, targetUserId: number): Promise<void> => {
        await fetch(`${API_BASE}/admin/notifications/remind/${targetUserId}`, {
            method: 'POST',
            headers: getHeaders(userId),
        });
    },

    getLaggingManuals: async (userId: number): Promise<any[]> => {
        const res = await fetch(`${API_BASE}/admin/manuals/lagging`, {
            headers: getHeaders(userId),
        });
        if (!res.ok) return [];
        return res.json();
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

    // Organization Management
    getFacilities: async (userId: number): Promise<any[]> => {
        const res = await fetch(`${API_BASE}/facilities`, {
            headers: getHeaders(userId),
        });
        if (!res.ok) return [];
        return res.json();
    },

    createFacility: async (name: string, userId: number): Promise<any> => {
        const res = await fetch(`${API_BASE}/facilities`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getHeaders(userId)
            },
            body: JSON.stringify({ name }),
        });
        return res.json();
    },

    updateFacility: async (id: number, name: string, userId: number): Promise<any> => {
        const res = await fetch(`${API_BASE}/facilities/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...getHeaders(userId)
            },
            body: JSON.stringify({ name }),
        });
        return res.json();
    },

    deleteFacility: async (id: number, userId: number): Promise<any> => {
        const res = await fetch(`${API_BASE}/facilities/${id}`, {
            method: 'DELETE',
            headers: getHeaders(userId),
        });
        return res.json();
    },

    getDepartments: async (userId: number): Promise<any[]> => {
        const res = await fetch(`${API_BASE}/departments`, {
            headers: getHeaders(userId),
        });
        if (!res.ok) return [];
        return res.json();
    },

    getDepartmentsByFacility: async (facilityId: number, userId: number): Promise<any[]> => {
        const res = await fetch(`${API_BASE}/departments/by-facility/${facilityId}`, {
            headers: getHeaders(userId),
        });
        if (!res.ok) return [];
        return res.json();
    },

    createDepartment: async (name: string, facilityId: number, userId: number): Promise<any> => {
        const res = await fetch(`${API_BASE}/departments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getHeaders(userId)
            },
            body: JSON.stringify({ name, facilityId }),
        });
        return res.json();
    },

    updateDepartment: async (id: number, name: string, userId: number): Promise<any> => {
        const res = await fetch(`${API_BASE}/departments/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...getHeaders(userId)
            },
            body: JSON.stringify({ name }),
        });
        return res.json();
    },

    deleteDepartment: async (id: number, userId: number): Promise<any> => {
        const res = await fetch(`${API_BASE}/departments/${id}`, {
            method: 'DELETE',
            headers: getHeaders(userId),
        });
        return res.json();
    },

    getNodeStatuses: async (): Promise<any[]> => {
        const res = await fetch(`${API_BASE}/nodes/status`);
        if (!res.ok) return [];
        return res.json();
    },

    // Personal Dashboard
    getMyDashboard: async (userId: number): Promise<any> => {
        const response = await fetch(`${API_BASE}/my/summary`, {
            headers: {
                'X-User-Id': userId.toString()
            }
        });
        if (!response.ok) throw new Error('Failed to fetch dashboard');
        return response.json();
    },

    // Attendance Requests
    submitAttendanceRequest: async (
        userId: number,
        type: string,
        durationType: string | null,
        startDate: string,
        endDate: string,
        startTime: string,
        endTime: string,
        reason: string
    ): Promise<any> => {
        const response = await fetch(`${API_BASE}/attendance/requests`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': userId.toString()
            },
            body: JSON.stringify({ type, durationType, startDate, endDate, startTime, endTime, reason })
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || '勤怠申請の送信に失敗しました');
        }
        return response.json();
    },

    getMyAttendanceRequests: async (userId: number): Promise<any[]> => {
        const response = await fetch(`${API_BASE}/attendance/requests/my`, {
            headers: {
                'X-User-Id': userId.toString()
            }
        });
        if (!response.ok) throw new Error('Failed to fetch attendance requests');
        return response.json();
    },

    getMyHistory: async (userId: number, startDate?: string): Promise<any[]> => {
        const query = startDate ? `?startDate=${startDate}` : '';
        const response = await fetch(`${API_BASE}/users/me/history${query}`, {
            headers: getHeaders(userId)
        });
        if (!response.ok) throw new Error('Failed to fetch history');
        return response.json();
    },

    getMyPaidLeaves: async (userId: number): Promise<any[]> => {
        const response = await fetch(`${API_BASE}/leaves/history`, {
            headers: {
                'X-User-Id': userId.toString()
            }
        });
        if (!response.ok) throw new Error('Failed to fetch paid leave history');
        return response.json();
    },

    submitPaidLeave: async (
        userId: number,
        startDate: string,
        endDate: string,
        reason: string,
        leaveType: string
    ): Promise<any> => {
        const response = await fetch(`${API_BASE}/leaves/apply`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': userId.toString()
            },
            body: JSON.stringify({ startDate, endDate, reason, leaveType })
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || '有給申請の送信に失敗しました');
        }
        return response.json();
    },

    submitBulkPaidLeave: async (
        userId: number,
        requests: Array<{ startDate: string; endDate: string; reason: string; leaveType: string }>
    ): Promise<any[]> => {
        const response = await fetch(`${API_BASE}/leaves/apply-bulk`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-User-Id': userId.toString()
            },
            body: JSON.stringify(requests)
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || '一括申請の送信に失敗しました');
        }
        return response.json();
    },

    getAllAttendanceRequests: async (userId: number): Promise<any[]> => {
        const res = await fetch(`${API_BASE}/admin/attendance/requests`, {
            headers: getHeaders(userId),
        });
        if (!res.ok) return [];
        return res.json();
    },

    getAllPaidLeaves: async (userId: number): Promise<any[]> => {
        const res = await fetch(`${API_BASE}/admin/paid-leaves`, {
            headers: getHeaders(userId),
        });
        if (!res.ok) return [];
        return res.json();
    },

    approvePaidLeave: async (userId: number, id: number): Promise<any> => {
        const res = await fetch(`${API_BASE}/admin/paid-leaves/${id}/approve`, {
            method: 'PUT',
            headers: getHeaders(userId),
        });
        return res.json();
    },

    rejectPaidLeave: async (userId: number, id: number): Promise<any> => {
        const res = await fetch(`${API_BASE}/admin/paid-leaves/${id}/reject`, {
            method: 'PUT',
            headers: getHeaders(userId),
        });
        return res.json();
    },

    approveAttendanceRequest: async (userId: number, id: number): Promise<any> => {
        const res = await fetch(`${API_BASE}/admin/attendance/requests/${id}/approve`, {
            method: 'PUT',
            headers: getHeaders(userId),
        });
        return res.json();
    },

    rejectAttendanceRequest: async (userId: number, id: number): Promise<any> => {
        const res = await fetch(`${API_BASE}/admin/attendance/requests/${id}/reject`, {
            method: 'PUT',
            headers: getHeaders(userId),
        });
        return res.json();
    },

    bulkApprovePaidLeaves: async (userId: number, ids: number[]): Promise<any> => {
        const res = await fetch(`${API_BASE}/admin/paid-leaves/bulk-approve`, {
            method: 'POST',
            headers: {
                ...getHeaders(userId),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(ids),
        });
        return res.status === 200;
    },

    bulkApproveAttendanceRequests: async (userId: number, ids: number[]): Promise<any> => {
        const res = await fetch(`${API_BASE}/admin/attendance/requests/bulk-approve`, {
            method: 'POST',
            headers: {
                ...getHeaders(userId),
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(ids),
        });
        return res.status === 200;
    },

    // Personal Dashboard
    getPersonalDashboard: async (userId: number): Promise<any> => {
        const res = await fetch(`${API_BASE}/my/dashboard`, {
            headers: getHeaders(userId),
        });
        return res.json();
    },
    updateUserLeaveSettings: async (userId: number, id: number, settings: { paidLeaveDays: number, joinedDate: string }): Promise<any> => {
        const res = await fetch(`${API_BASE}/admin/users/${id}/leave-settings`, {
            method: 'PATCH',
            headers: getHeaders(userId),
            body: JSON.stringify(settings)
        });
        return res.json();
    },

    grantPaidLeave: async (adminUserId: number, targetUserId: number, daysToGrant: number, reason: string): Promise<void> => {
        const res = await fetch(`${API_BASE}/admin/users/${targetUserId}/grant-leave`, {
            method: 'POST',
            headers: getHeaders(adminUserId),
            body: JSON.stringify({ daysToGrant, reason })
        });
        if (!res.ok) throw new Error('有給付与に失敗しました');
    },

    getLeaveStatus: async (userId: number): Promise<{
        remainingDays: number;
        nextGrantDate: string;
        nextGrantDays: number;
        obligatoryDaysTaken?: number;
        obligatoryTarget?: number;
        isObligationMet?: boolean;
        isWarning?: boolean;
        daysRemainingToObligation?: number;
        obligatoryDeadline?: string;
    }> => {
        const response = await fetch(`${API_BASE}/users/me/leave-status`, {
            headers: getHeaders(userId)
        });
        if (!response.ok) throw new Error('Failed to fetch leave status');
        return response.json();
    },

    getAccrualHistory: async (adminUserId: number, targetUserId: number): Promise<any[]> => {
        const res = await fetch(`${API_BASE}/admin/users/${targetUserId}/accrual-history`, {
            headers: getHeaders(adminUserId),
        });
        if (!res.ok) return [];
        return res.json();
    },

    getAdminLeaveMonitoring: async (userId: number): Promise<AdminLeaveMonitoring[]> => {
        const res = await fetch(`${API_BASE}/admin/leave-monitoring`, {
            headers: getHeaders(userId)
        });
        if (!res.ok) return [];
        return res.json();
    },

    // Announcements
    getAnnouncements: async (userId: number): Promise<Announcement[]> => {
        const res = await fetch(`${API_BASE}/announcements`, {
            headers: getHeaders(userId),
        });
        if (!res.ok) return [];
        return res.json();
    },

    getAdminAnnouncements: async (userId: number): Promise<Announcement[]> => {
        const res = await fetch(`${API_BASE}/admin/announcements`, {
            headers: getHeaders(userId),
        });
        if (!res.ok) return [];
        return res.json();
    },

    createAnnouncement: async (userId: number, data: {
        title: string;
        content: string;
        priority: string;
        displayUntil: string;
        facilityId?: number | null;
        relatedWikiId?: number | null;
        relatedEventId?: number | null;
        relatedType?: 'WIKI' | 'TRAINING_EVENT' | null;
    }): Promise<Announcement> => {
        const res = await fetch(`${API_BASE}/admin/announcements`, {
            method: 'POST',
            headers: getHeaders(userId),
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to create announcement');
        return res.json();
    },

    updateAnnouncement: async (userId: number, id: number, data: {
        title: string;
        content: string;
        priority: string;
        displayUntil: string;
        relatedWikiId?: number | null;
        relatedEventId?: number | null;
        relatedType?: 'WIKI' | 'TRAINING_EVENT' | null;
    }): Promise<Announcement> => {
        const res = await fetch(`${API_BASE}/admin/announcements/${id}`, {
            method: 'PUT',
            headers: getHeaders(userId),
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error('Failed to update announcement');
        return res.json();
    },

    deleteAnnouncement: async (userId: number, id: number): Promise<void> => {
        const res = await fetch(`${API_BASE}/admin/announcements/${id}`, {
            method: 'DELETE',
            headers: getHeaders(userId),
        });
        if (!res.ok) throw new Error('Failed to delete announcement');
    },

    // Training Records (研修完了記録)
    completeTraining: async (userId: number, announcementId: number): Promise<{ message: string; alreadyCompleted: boolean }> => {
        const res = await fetch(`${API_BASE}/training-records`, {
            method: 'POST',
            headers: getHeaders(userId),
            body: JSON.stringify({ announcementId }),
        });
        if (!res.ok) throw new Error('Failed to complete training');
        return res.json();
    },

    checkTrainingCompletion: async (userId: number, announcementId: number): Promise<{ completed: boolean }> => {
        const res = await fetch(`${API_BASE}/training-records/check?announcementId=${announcementId}`, {
            headers: getHeaders(userId),
        });
        if (!res.ok) return { completed: false };
        return res.json();
    },

    getTrainingStats: async (userId: number, announcementId?: number): Promise<any> => {
        const url = announcementId
            ? `${API_BASE}/admin/training-records/stats?announcementId=${announcementId}`
            : `${API_BASE}/admin/training-records/stats`;
        const res = await fetch(url, {
            headers: getHeaders(userId),
        });
        if (!res.ok) return [];
        return res.json();
    },

    // Training Management
    getTrainingEvents: async (userId: number): Promise<TrainingEvent[]> => {
        const res = await fetch(`${API_BASE}/training/events`, {
            headers: getHeaders(userId),
        });
        if (!res.ok) return [];
        return res.json();
    },

    getTrainingEvent: async (userId: number, id: number): Promise<TrainingEvent> => {
        const res = await fetch(`${API_BASE}/training/events/${id}`, {
            headers: getHeaders(userId),
        });
        if (!res.ok) throw new Error('Training event not found');
        return res.json();
    },

    getCommittees: async (userId: number): Promise<Committee[]> => {
        const res = await fetch(`${API_BASE}/committees`, {
            headers: getHeaders(userId),
        });
        if (!res.ok) return [];
        return res.json();
    },

    getMyTrainingResponses: async (userId: number): Promise<TrainingResponse[]> => {
        const res = await fetch(`${API_BASE}/training/responses/me`, {
            headers: getHeaders(userId),
        });
        if (!res.ok) return [];
        return res.json();
    },

    getAdminTrainingEvents: async (userId: number): Promise<TrainingEvent[]> => {
        const res = await fetch(`${API_BASE}/training/events/admin`, {
            headers: getHeaders(userId),
        });
        if (!res.ok) return [];
        return res.json();
    },

    createTrainingEvent: async (userId: number, data: any): Promise<TrainingEvent> => {
        const res = await fetch(`${API_BASE}/training/events`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getHeaders(userId)
            },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || errorData.error || 'Failed to create event');
        }
        return res.json();
    },

    updateTrainingEvent: async (userId: number, id: number, data: any): Promise<TrainingEvent> => {
        const res = await fetch(`${API_BASE}/training/events/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...getHeaders(userId)
            },
            body: JSON.stringify(data),
        });
        if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || errorData.error || 'Failed to update event');
        }
        return res.json();
    },

    deleteTrainingEvent: async (userId: number, id: number): Promise<void> => {
        const res = await fetch(`${API_BASE}/training/events/${id}`, {
            method: 'DELETE',
            headers: getHeaders(userId),
        });
        if (!res.ok) throw new Error('Failed to delete event');
    },

    getTrainingQrCode: async (userId: number, id: number): Promise<string> => {
        const res = await fetch(`${API_BASE}/training/events/${id}/qrcode`, {
            headers: getHeaders(userId),
        });
        if (!res.ok) throw new Error('Failed to get QR code');
        const data = await res.json();
        return data.url;
    },

    submitTrainingResponse: async (userId: number, eventId: number, answersJson: string): Promise<TrainingResponse> => {
        const res = await fetch(`${API_BASE}/training/responses/${eventId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getHeaders(userId)
            },
            body: JSON.stringify({ answersJson }),
        });
        if (!res.ok) throw new Error('Failed to submit response');
        return res.json();
    },

    getTrainingResponses: async (userId: number, eventId: number): Promise<TrainingResponse[]> => {
        const res = await fetch(`${API_BASE}/training/responses/${eventId}`, {
            headers: getHeaders(userId),
        });
        if (!res.ok) return [];
        return res.json();
    },

    exportTrainingResponses: async (eventId: number): Promise<string> => {
        const res = await fetch(`${API_BASE}/training/responses/${eventId}/export`, {
            method: 'GET',
            headers: getHeaders(),
        });
        return res.text();
    },

    createCommittee: async (userId: number, name: string, description: string): Promise<Committee> => {
        const res = await fetch(`${API_BASE}/committees`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getHeaders(userId)
            },
            body: JSON.stringify({ name, description }),
        });
        if (!res.ok) throw new Error('Failed to create committee');
        return res.json();
    },
};

