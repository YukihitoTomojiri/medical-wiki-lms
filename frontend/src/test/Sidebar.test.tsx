import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Layout from '../components/Layout';
import { User } from '../types';

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
}));

const mockUser = (role: 'USER' | 'ADMIN' | 'DEVELOPER'): User => ({
    id: 1,
    employeeId: 'test',
    name: 'Test User',
    facility: 'Main',
    department: 'General',
    role
});

describe('Sidebar Menu Visibility', () => {
    it('shows only basic menus for USER role', () => {
        render(
            <BrowserRouter>
                <Layout user={mockUser('USER')} onLogout={() => { }}>
                    <div>Content</div>
                </Layout>
            </BrowserRouter>
        );

        expect(screen.getByText('マニュアル')).toBeDefined();
        expect(screen.getByText('Myページ')).toBeDefined();
        expect(screen.queryByText('管理者ダッシュボード')).toBeNull();
        expect(screen.queryByText('開発者メニュー')).toBeNull();
    });

    it('shows Admin Dashboard for ADMIN role', () => {
        render(
            <BrowserRouter>
                <Layout user={mockUser('ADMIN')} onLogout={() => { }}>
                    <div>Content</div>
                </Layout>
            </BrowserRouter>
        );

        expect(screen.getByText('マニュアル')).toBeDefined();
        expect(screen.getByText('管理者ダッシュボード')).toBeDefined();
        expect(screen.queryByText('開発者メニュー')).toBeNull();
    });

    it('shows all menus including Developer Menu for DEVELOPER role', () => {
        render(
            <BrowserRouter>
                <Layout user={mockUser('DEVELOPER')} onLogout={() => { }}>
                    <div>Content</div>
                </Layout>
            </BrowserRouter>
        );

        expect(screen.getByText('マニュアル')).toBeDefined();
        expect(screen.getByText('管理者ダッシュボード')).toBeDefined();
        expect(screen.getByText('開発者メニュー')).toBeDefined();
    });
});
