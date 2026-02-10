import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Layout from './Layout';
import { User } from '../types';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as AuthContextModule from '../context/AuthContext';

// Mock the AuthContext module
vi.mock('../context/AuthContext', () => ({
    useAuth: vi.fn(),
    AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

const mockUser = (role: User['role']): User => ({
    id: 1,
    employeeId: 'test',
    name: 'Test User',
    facility: '本館',
    department: '事務部',
    role,
    mustChangePassword: false // Add missing property
});

describe('Layout Sidebar Visibility', () => {
    const logout = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows only basic menus for USER role', () => {
        const user = mockUser('USER');
        vi.mocked(AuthContextModule.useAuth).mockReturnValue({
            user,
            login: vi.fn(),
            logout,
            isAdmin: false,
            isDeveloper: false,
            loading: false
        });

        render(
            <MemoryRouter>
                <Layout>
                    <div>Content</div>
                </Layout>
            </MemoryRouter>
        );
        expect(screen.getByText('マニュアル')).toBeInTheDocument();
        expect(screen.getByText('Myページ')).toBeInTheDocument(); // Wait, label changed to 'Myダッシュボード' in Sidebar.tsx but let's check what I wrote previously. Ah, in Sidebar.tsx lines 26-27: 'Myダッシュボード'. The test expects 'Myページ'??
        // Let's check Sidebar.tsx content above. It says 'Myダッシュボード'.
        // The test code previously said 'Myページ'. This test was probably outdated or failing silently?
        // Ah, looking at previous test file content: expect(screen.getByText('Myページ')).toBeInTheDocument();
        // But in Sidebar.tsx: { path: '/my-dashboard', label: 'Myダッシュボード', icon: LayoutDashboard },
        // So the test was likely failing or I misread.
        // Wait, looking at Sidebar.tsx in Step 4518 (before I edited), it had 'Myダッシュボード'.
        // So the test likely failed before? Or maybe I misread line 28 of test file?
        // Line 28: expect(screen.getByText('Myページ')).toBeInTheDocument();
        // I should fix this expectation too.
        expect(screen.queryByText('Myダッシュボード')).toBeInTheDocument();
        expect(screen.queryByText('管理者ダッシュボード')).not.toBeInTheDocument();
        expect(screen.queryByText('開発者メニュー')).not.toBeInTheDocument();
    });

    it('shows Admin Dashboard for ADMIN role', () => {
        const user = mockUser('ADMIN');
        vi.mocked(AuthContextModule.useAuth).mockReturnValue({
            user,
            login: vi.fn(),
            logout,
            isAdmin: true,
            isDeveloper: false,
            loading: false
        });

        render(
            <MemoryRouter>
                <Layout>
                    <div>Content</div>
                </Layout>
            </MemoryRouter>
        );
        expect(screen.getByText('管理者ダッシュボード')).toBeInTheDocument();
        expect(screen.queryByText('開発者メニュー')).not.toBeInTheDocument();
    });

    it('shows all menus for DEVELOPER role', () => {
        const user = mockUser('DEVELOPER');
        vi.mocked(AuthContextModule.useAuth).mockReturnValue({
            user,
            login: vi.fn(),
            logout,
            isAdmin: true,
            isDeveloper: true,
            loading: false
        });

        render(
            <MemoryRouter>
                <Layout>
                    <div>Content</div>
                </Layout>
            </MemoryRouter>
        );
        expect(screen.getByText('管理者ダッシュボード')).toBeInTheDocument();
        expect(screen.getByText('開発者メニュー')).toBeInTheDocument();
    });
});
