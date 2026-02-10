
import {
    Users, LogOut, BookOpen, LayoutDashboard, Database, Building2
} from 'lucide-react';
import { useMemo } from 'react';
import { NavigationDrawer } from './ui/NavigationDrawer';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
    onLogout: () => void;
    onClose?: () => void;
}

export default function Sidebar({ onLogout, onClose }: SidebarProps) {
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
            <div className="p-6 md:p-8 flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-m3-primary text-m3-on-primary rounded-xl flex items-center justify-center shadow-md">
                    <BookOpen size={20} />
                </div>
                <div>
                    <h1 className="text-sm font-bold text-m3-on-surface tracking-tight">Medical Wiki</h1>
                    <p className="text-[10px] text-m3-outline font-medium tracking-wider uppercase">LMS Network</p>
                </div>
            </div>

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

            <div className="p-4 border-t border-m3-outline-variant/20">
                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-6 py-4 rounded-full text-m3-error hover:bg-m3-error-container hover:text-m3-on-error-container transition-all font-medium text-sm"
                >
                    <LogOut size={22} />
                    <span>ログアウト</span>
                </button>
            </div>
        </div>
    );
}
