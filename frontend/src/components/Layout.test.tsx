import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Layout from './Layout';
import { User } from '../types';
import { describe, it, expect, vi } from 'vitest';

const mockUser = (role: User['role']): User => ({
    id: 1,
    employeeId: 'test',
    name: 'Test User',
    facility: '本館',
    department: '事務部',
    role
});

describe('Layout Sidebar Visibility', () => {
    const onLogout = vi.fn();

    it('shows only basic menus for USER role', () => {
        render(
            <MemoryRouter>
                <Layout user={mockUser('USER')} onLogout={onLogout}>
                    <div>Content</div>
                </Layout>
            </MemoryRouter>
        );
        expect(screen.getByText('マニュアル')).toBeInTheDocument();
        expect(screen.getByText('Myページ')).toBeInTheDocument();
        expect(screen.queryByText('管理者ダッシュボード')).not.toBeInTheDocument();
        expect(screen.queryByText('開発者メニュー')).not.toBeInTheDocument();
    });

    it('shows Admin Dashboard for ADMIN role', () => {
        render(
            <MemoryRouter>
                <Layout user={mockUser('ADMIN')} onLogout={onLogout}>
                    <div>Content</div>
                </Layout>
            </MemoryRouter>
        );
        expect(screen.getByText('管理者ダッシュボード')).toBeInTheDocument();
        expect(screen.queryByText('開発者メニュー')).not.toBeInTheDocument();
    });

    it('shows all menus for DEVELOPER role', () => {
        render(
            <MemoryRouter>
                <Layout user={mockUser('DEVELOPER')} onLogout={onLogout}>
                    <div>Content</div>
                </Layout>
            </MemoryRouter>
        );
        expect(screen.getByText('管理者ダッシュボード')).toBeInTheDocument();
        expect(screen.getByText('開発者メニュー')).toBeInTheDocument();
    });
});
