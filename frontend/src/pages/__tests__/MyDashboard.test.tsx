import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MyDashboard from '../MyDashboard';
import { BrowserRouter } from 'react-router-dom';
import { User } from '../../types';
import * as apiModule from '../../api';

// Mock API
vi.mock('../../api', () => ({
    api: {
        getMyDashboard: vi.fn(),
        getMyProgress: vi.fn(),
        getMyHistory: vi.fn(),
        getLeaveStatus: vi.fn(),
        getTrainingEvents: vi.fn(),
        getMyTrainingResponses: vi.fn(),
        submitPaidLeave: vi.fn(),
        submitAttendanceRequest: vi.fn(),
    }
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

const mockUser: User = {
    id: 1,
    employeeId: '1001',
    name: 'Test User',
    role: 'USER',
    facility: '本館',
    department: '看護部',
    email: 'test@example.com',
    joinedDate: '2023-01-01',
    paidLeaveDays: 10
};

describe('MyDashboard Component - Leave Forms', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (apiModule.api.getMyDashboard as any).mockResolvedValue({});
        (apiModule.api.getMyProgress as any).mockResolvedValue([]);
        (apiModule.api.getMyHistory as any).mockResolvedValue([]);
        (apiModule.api.getLeaveStatus as any).mockResolvedValue({});
        (apiModule.api.getTrainingEvents as any).mockResolvedValue([]);
        (apiModule.api.getMyTrainingResponses as any).mockResolvedValue([]);
    });

    it('renders dashboard successfully', async () => {
        render(
            <BrowserRouter>
                <MyDashboard user={mockUser} />
            </BrowserRouter>
        );
        await waitFor(() => {
            expect(screen.getByText(`ようこそ、${mockUser.name}さん。今日のタスクを確認しましょう。`)).toBeInTheDocument();
        });
    });

    it('shows error when start date is after end date in paid leave form', async () => {
        const user = userEvent.setup();
        render(
            <BrowserRouter>
                <MyDashboard user={mockUser} />
            </BrowserRouter>
        );

        // Wait for loading to finish
        await waitFor(() => {
            expect(screen.getByText(`ようこそ、${mockUser.name}さん。今日のタスクを確認しましょう。`)).toBeInTheDocument();
        });

        // Switch to Leave Tab
        await user.click(screen.getByText('有給休暇'));

        // Toggle Form
        await user.click(screen.getByText('フォームを表示'));

        // Select Paid Leave (Default)
        // Set Start Date > End Date
        const startDateInput = screen.getByLabelText('開始日');
        const endDateInput = screen.getByLabelText('終了日');

        fireEvent.change(startDateInput, { target: { value: '2025-05-02' } });
        fireEvent.change(endDateInput, { target: { value: '2025-05-01' } });

        // Find submit button
        const submitButton = screen.getByRole('button', { name: '申請を送信' });
        await user.click(submitButton);

        // Expect error message
        await waitFor(() => {
            expect(screen.getByText('開始日は終了日より前の日付を指定してください')).toBeInTheDocument();
        });
    });

    it('submits valid attendance request', async () => {
        (apiModule.api.submitAttendanceRequest as any).mockResolvedValue({ success: true });
        const user = userEvent.setup();
        render(
            <BrowserRouter>
                <MyDashboard user={mockUser} />
            </BrowserRouter>
        );

        // Switch to Leave Tab
        await user.click(screen.getByText('有給休暇'));
        await user.click(screen.getByText('フォームを表示'));

        // Change request type to LATE
        const typeSelect = screen.getByRole('combobox');
        await user.selectOptions(typeSelect, 'LATE');

        // Fill form
        fireEvent.change(screen.getByLabelText('開始日'), { target: { value: '2025-05-01' } });
        fireEvent.change(screen.getByLabelText('終了日'), { target: { value: '2025-05-01' } });
        fireEvent.change(screen.getByLabelText('開始時間'), { target: { value: '10:00' } });
        fireEvent.change(screen.getByLabelText('終了時間'), { target: { value: '11:00' } });
        await user.type(screen.getByPlaceholderText('理由を入力...'), 'Traffic delay');

        // Submit
        await user.click(screen.getByRole('button', { name: '申請を送信' }));

        await waitFor(() => {
            expect(apiModule.api.submitAttendanceRequest).toHaveBeenCalledWith(
                1, 'LATE', null, '2025-05-01', '2025-05-01', '10:00', '11:00', 'Traffic delay'
            );
            expect(mockNavigate).toHaveBeenCalledWith('/submission-success');
        });
    });
});
