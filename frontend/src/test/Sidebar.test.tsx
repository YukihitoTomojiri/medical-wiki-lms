import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Layout from '../components/Layout';
import { User } from '../types';
import * as AuthContextModule from '../context/AuthContext';

// Mock lucide-react to avoid issues with SVG rendering in jsdom
vi.mock('lucide-react', () => ({
    BookOpen: () => <div data-testid="icon-book" />,
    User: () => <div data-testid="icon-user" />,
    LayoutDashboard: () => <div data-testid="icon-dash" />,
    LogOut: () => <div data-testid="icon-logout" />,
    Menu: () => <div data-testid="icon-menu" />,
    X: () => <div data-testid="icon-x" />,
    Building2: () => <div data-testid="icon-build" />,
    Database: () => <div data-testid="icon-db" />,
    Users: () => <div data-testid="icon-users" />,
}));

// Mock the AuthContext module
vi.mock('../context/AuthContext', () => ({
    useAuth: vi.fn(),
    AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

const mockUser = (role: 'USER' | 'ADMIN' | 'DEVELOPER'): User => ({
    id: 1,
    employeeId: 'test',
    name: 'Test User',
    facility: 'Main',
    department: 'General',
    role,
    mustChangePassword: false
});

describe('Sidebar Menu Visibility', () => {
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
            <BrowserRouter>
                <Layout>
                    <div>Content</div>
                </Layout>
            </BrowserRouter>
        );

        expect(screen.getByText('マニュアル')).toBeDefined();
        expect(screen.getByText('Myダッシュボード')).toBeDefined();
        const adminDashboard = screen.queryByText('管理者ダッシュボード');
        expect(adminDashboard).toBeNull();
        const devMenu = screen.queryByText('開発者メニュー');
        expect(devMenu).toBeNull();
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
            <BrowserRouter>
                <Layout>
                    <div>Content</div>
                </Layout>
            </BrowserRouter>
        );

        expect(screen.getByText('マニュアル')).toBeDefined();
        expect(screen.getByText('管理者ダッシュボード')).toBeDefined();
        const devMenu = screen.queryByText('開発者メニュー');
        expect(devMenu).toBeNull();
    });

    it('shows all menus including Developer Menu for DEVELOPER role', () => {
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
            <BrowserRouter>
                <Layout>
                    <div>Content</div>
                </Layout>
            </BrowserRouter>
        );

        expect(screen.getByText('マニュアル')).toBeDefined();
        expect(screen.getByText('管理者ダッシュボード')).toBeDefined();
        expect(screen.getByText('開発者メニュー')).toBeDefined();
    });
});
