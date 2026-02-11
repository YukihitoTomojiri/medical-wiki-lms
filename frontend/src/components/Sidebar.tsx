import {
    Users, BookOpen, LayoutDashboard, Database, Building2
} from 'lucide-react';
import { useMemo } from 'react';
import { NavigationDrawer } from './ui/NavigationDrawer';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
    onClose?: () => void;
}

export default function Sidebar({ onClose }: SidebarProps) {
    const { user, isAdmin, isDeveloper } = useAuth();

    // Fallback if user is null (shouldn't happen in protected routes)
    if (!user) return null;

    const mainItems = useMemo(() => [
        { path: '/manuals', label: 'マニュアル', icon: BookOpen },
        { path: '/my-dashboard', label: 'Myダッシュボード', icon: LayoutDashboard },
    ], []);

    const adminItems = useMemo(() => [
        { path: '/admin', label: '管理者ダッシュボード', icon: LayoutDashboard, roles: ['ADMIN', 'DEVELOPER'] },
        { path: '/admin/users', label: 'ユーザー管理', icon: Users, roles: ['ADMIN', 'DEVELOPER'] },
        { path: '/admin/organization', label: '組織管理', icon: Building2, roles: ['ADMIN', 'DEVELOPER'] },
    ], []);

    const devItems = useMemo(() => [
        { path: '/developer', label: '開発者メニュー', icon: Database, roles: ['DEVELOPER'] },
    ], []);

    return (
        <div className="flex flex-col h-full bg-m3-surface-container-low border-r border-m3-outline-variant/20 font-sans">
            {/* Branding Area for Mobile/Drawer */}
            {/* Branding Area removed for Modern Header integration */}
            <div className="h-4" />

            <nav className="flex-1 overflow-y-auto px-2 space-y-6">
                <div>
                    <div className="px-6 mb-2 text-xs font-bold text-m3-outline uppercase tracking-wider">Main</div>
                    <NavigationDrawer items={mainItems} user={user} onItemClick={onClose} />
                </div>

                {(isAdmin || isDeveloper) && (
                    <div>
                        <div className="px-6 mb-2 text-xs font-bold text-m3-outline uppercase tracking-wider">Admin</div>
                        <NavigationDrawer items={adminItems} user={user} onItemClick={onClose} />
                    </div>
                )}

                {isDeveloper && (
                    <div>
                        <div className="px-6 mb-2 text-xs font-bold text-m3-outline uppercase tracking-wider">System</div>
                        <NavigationDrawer items={devItems} user={user} onItemClick={onClose} />
                    </div>
                )}
            </nav>
        </div>
    );
}
