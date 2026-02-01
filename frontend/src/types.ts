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
}

export interface UserCreateRequest {
    employeeId: string;
    name: string;
    password?: string;
    facility: string;
    department: string;
    role: 'ADMIN' | 'USER' | 'DEVELOPER';
}

