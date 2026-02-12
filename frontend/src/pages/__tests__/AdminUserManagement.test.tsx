import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AdminUserManagement from '../AdminUserManagement';
import { BrowserRouter } from 'react-router-dom';
import { User } from '../../types';
import * as apiModule from '../../api';

// Mock API
vi.mock('../../api', () => ({
    api: {
        getUsers: vi.fn(),
        getDistinctFacilities: vi.fn(),
        registerUser: vi.fn(),
        updateUser: vi.fn(),
        bulkDeleteUsers: vi.fn(),
    }
}));

const mockUser: User = {
    id: 1,
    employeeId: '9999',
    name: 'Admin User',
    role: 'ADMIN',
    facility: '本館',
    department: '管理部',
    email: 'admin@example.com',
    password: 'password',
    joinedDate: '2023-01-01',
    paidLeaveDays: 20,
    isActive: true
};

const mockUsers: User[] = [
    mockUser,
    {
        id: 2,
        employeeId: '1001',
        name: 'Test User',
        role: 'USER',
        facility: '本館',
        department: '看護部',
        email: 'test@example.com',
        password: 'password',
        joinedDate: '2024-01-01',
        paidLeaveDays: 10,
        isActive: true
    }
];

describe('AdminUserManagement Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (apiModule.api.getUsers as any).mockResolvedValue(mockUsers);
        (apiModule.api.getDistinctFacilities as any).mockResolvedValue(['本館', '別館']);
    });

    it('renders user list correctly', async () => {
        render(
            <BrowserRouter>
                <AdminUserManagement user={mockUser} />
            </BrowserRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Test User')).toBeInTheDocument();
            expect(screen.getByText('1001')).toBeInTheDocument();
        });
    });

    it('validates required fields in registration form', async () => {
        render(
            <BrowserRouter>
                <AdminUserManagement user={mockUser} />
            </BrowserRouter>
        );

        // Open Add Modal
        const addButton = screen.getByText('新規ユーザー登録');
        fireEvent.click(addButton);

        // Submit empty form
        const submitButton = screen.getByRole('button', { name: '登録する' });
        fireEvent.click(submitButton);

        // Check for HTML5 validation or error messages if custom validation exists.
        // Since the inputs have `required` attribute, browser validation handles it.
        // We can check if the inputs are invalid.
        const employeeIdInput = screen.getByPlaceholderText('例: 1001');
        expect(employeeIdInput).toBeInvalid();

        const nameInput = screen.getByPlaceholderText('例: 山田 太郎');
        expect(nameInput).toBeInvalid();
    });

    it('calls registerUser API with correct data', async () => {
        (apiModule.api.registerUser as any).mockResolvedValue({ success: true });
        const user = userEvent.setup();

        render(
            <BrowserRouter>
                <AdminUserManagement user={mockUser} />
            </BrowserRouter>
        );

        // Open Add Modal
        await user.click(screen.getByText('新規ユーザー登録'));

        // Fill form
        await user.type(screen.getByPlaceholderText('例: 1001'), '2001');
        await user.type(screen.getByPlaceholderText('例: 山田 太郎'), 'New User');
        await user.type(screen.getByPlaceholderText('例: 事務部'), 'IT部');

        // Date input needs specific handling or just setting value
        const joinedDateInput = screen.getByLabelText('入職日');
        fireEvent.change(joinedDateInput, { target: { value: '2025-04-01' } });

        // Submit
        await user.click(screen.getByRole('button', { name: '登録する' }));

        await waitFor(() => {
            expect(apiModule.api.registerUser).toHaveBeenCalledWith(1, expect.objectContaining({
                employeeId: '2001',
                name: 'New User',
                department: 'IT部',
                joinedDate: '2025-04-01'
            }));
        });
    });
});
