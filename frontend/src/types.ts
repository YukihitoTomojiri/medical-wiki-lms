export interface User {
    id: number;
    employeeId: string;
    name: string;
    facility: string;
    department: string;
    role: 'ADMIN' | 'USER' | 'DEVELOPER';
    deletedAt?: string;
    createdAt?: string;
    updatedAt?: string;
    mustChangePassword?: boolean;
    invitationToken?: string;
    email?: string;
    paidLeaveDays?: number;
    joinedDate?: string;
}

export interface Manual {
    id: number;
    title: string;
    content: string;
    category: string;
    authorName: string;
    createdAt: string;
    updatedAt: string;
    isRead: boolean;
    pdfUrl?: string;
}

export interface Progress {
    id: number;
    manualId: number;
    manualTitle: string;
    category: string;
    readAt: string;
}

export interface UserProgress {
    userId: number;
    employeeId: string;
    name: string;
    facility: string;
    department: string;
    totalManuals: number;
    readManuals: number;
    progressPercentage: number;
    progressList: Progress[];
}

export interface LoginRequest {
    employeeId: string;
    password: string;
}

export interface LoginResponse {
    success: boolean;
    user?: User;
    message?: string;
}

export interface UserUpdateRequest {
    role?: 'ADMIN' | 'USER' | 'DEVELOPER';
    facility?: string;
    department?: string;
    email?: string;
    paidLeaveDays?: number;
    joinedDate?: string;
}

export interface UserCreateRequest {
    employeeId: string;
    name: string;
    password?: string;
    facility: string;
    department: string;
    role: 'ADMIN' | 'USER' | 'DEVELOPER';
    email?: string;
    paidLeaveDays?: number;
    joinedDate?: string;
}


export type RequestType = 'PAID_LEAVE' | 'ABSENCE' | 'LATE' | 'EARLY_DEPARTURE';
export type DurationType = 'FULL_DAY' | 'HALF_DAY_AM' | 'HALF_DAY_PM';
export type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface AttendanceRequest {
    id: number;
    userId: number;
    userName: string;
    type: RequestType;
    durationType?: DurationType;
    startDate: string;
    endDate: string;
    startTime?: string;
    endTime?: string;
    reason: string;
    rejectionReason?: string;
    status: RequestStatus;
    createdAt: string;
    updatedAt: string;
}
