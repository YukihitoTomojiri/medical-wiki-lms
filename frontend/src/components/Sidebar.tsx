import { Link, useLocation } from 'react-router-dom';
import { User } from '../types';
import {
    BookOpen,
    LayoutDashboard,
    LogOut,
    Building2,
    Database,
    Users
} from 'lucide-react';

interface SidebarProps {
    user: User;
    onLogout: () => void;
    onClose?: () => void;
}

export default function Sidebar({ user, onLogout, onClose }: SidebarProps) {
    const location = useLocation();

    const sections = [
        {
            title: 'メインメニュー',
            items: [
                { path: '/manuals', label: 'マニュアル', icon: BookOpen },
                { path: '/my-dashboard', label: 'Myダッシュボード', icon: LayoutDashboard },
            ]
        },
        ...(user.role === 'ADMIN' || user.role === 'DEVELOPER' ? [{
            title: '管理設定',
            className: 'bg-slate-50/50 rounded-2xl p-2 -mx-2 border border-slate-100/50',
            items: [
                { path: '/admin', label: '管理者ダッシュボード', icon: LayoutDashboard },
                { path: '/admin/users', label: 'ユーザー管理', icon: Users },
            ]
        }] : []),
        ...(user.role === 'DEVELOPER' ? [{
            title: 'システム開発',
            className: 'bg-amber-50/30 rounded-2xl p-2 -mx-2 border border-amber-100/30',
            items: [
                { path: '/admin/organization', label: '組織管理', icon: Building2 },
                { path: '/developer', label: '開発者メニュー', icon: Database },
            ]
        }] : []),
    ];

    return (
        <div className="flex flex-col h-full">
            <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto">
                {sections.map((section, idx) => (
                    <div key={idx} className={`space-y-2 ${section.className || ''}`}>
                        {section.title && (
                            <h3 className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                                {section.title}
                            </h3>
                        )}
                        <div className="space-y-1">
                            {section.items.map((item) => {
                                const Icon = item.icon;
                                const isActive = location.pathname === item.path ||
                                    (item.path === '/manuals' && location.pathname.startsWith('/manuals'));

                                return (
                                    <Link
                                        key={item.path}
                                        to={item.path}
                                        onClick={onClose}
                                        className={`
                                            flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-all duration-200 group
                                            ${isActive
                                                ? 'bg-orange-500 text-white shadow-lg shadow-orange-200'
                                                : 'text-slate-600 hover:bg-orange-50 hover:text-orange-600'
                                            }
                                        `}
                                    >
                                        <Icon size={18} className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-orange-500'} transition-colors`} />
                                        <span className={`font-semibold text-sm tracking-tight ${isActive ? 'text-white' : ''}`}>{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="p-4 border-t border-slate-100 bg-white/50">
                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all font-bold text-sm"
                >
                    <LogOut size={18} />
                    <span>ログアウト</span>
                </button>
            </div>
        </div>
    );
}
