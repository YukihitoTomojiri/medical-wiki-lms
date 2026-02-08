import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User } from '../types';
import {
    BookOpen,
    LayoutDashboard,
    LogOut,
    Menu,
    X,
    Building2,
    Database,
    Users
} from 'lucide-react';
import { useState } from 'react';

interface LayoutProps {
    user: User;
    onLogout: () => void;
    children: ReactNode;
}

export default function Layout({ user, onLogout, children }: LayoutProps) {
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const handleLogoutClick = () => {
        setShowLogoutModal(true);
    };

    const confirmLogout = () => {
        setShowLogoutModal(false);
        onLogout();
    };

    const navItems = [
        { path: '/manuals', label: 'マニュアル', icon: BookOpen },
        { path: '/my-dashboard', label: 'Myダッシュボード', icon: LayoutDashboard },
        ...(user.role === 'ADMIN' || user.role === 'DEVELOPER' ? [{ path: '/admin', label: '管理者ダッシュボード', icon: LayoutDashboard }] : []),
        ...(user.role === 'ADMIN' || user.role === 'DEVELOPER' ? [{ path: '/admin/users', label: 'ユーザー管理', icon: Users }] : []),
        ...(user.role === 'DEVELOPER' ? [{ path: '/admin/organization', label: '組織管理', icon: Building2 }] : []),
        ...(user.role === 'DEVELOPER' ? [{ path: '/developer', label: '開発者メニュー', icon: Database }] : []),
    ];


    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-3">
                            <button
                                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                            >
                                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20">
                                    <BookOpen className="text-white" size={22} />
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-primary-600 bg-clip-text text-transparent">
                                        社内Wiki
                                    </h1>
                                    <p className="text-xs text-gray-500 -mt-0.5">学習管理システム</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {user.role === 'DEVELOPER' && location.pathname.startsWith('/admin') && (
                                <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-amber-100 border border-amber-200 rounded-full">
                                    <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                                    <span className="text-xs font-bold text-amber-700">開発者権限で代行中</span>
                                </div>
                            )}
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
                                <Building2 size={14} className="text-gray-500" />
                                <span className="text-sm text-gray-600">{user.facility}</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="hidden md:block text-right">
                                    <p className="text-sm font-bold text-gray-800">{user.name}</p>
                                    <p className="text-xs text-gray-500">
                                        {user.role === 'ADMIN' ? '管理者' : '職員'}
                                    </p>
                                </div>
                                <div className="w-10 h-10 bg-gradient-to-br from-medical-DEFAULT to-medical-dark rounded-full flex items-center justify-center text-white font-bold shadow-lg shadow-medical-DEFAULT/20">
                                    {user.name.charAt(0)}
                                </div>
                                <button
                                    onClick={handleLogoutClick}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all ml-2"
                                    title="ログアウト"
                                >
                                    <LogOut size={20} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex">
                {/* Sidebar */}
                <aside className={`
          fixed lg:sticky lg:top-16 inset-y-0 left-0 z-40
          w-64 bg-white/80 backdrop-blur-md border-r border-gray-200/50
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          lg:h-[calc(100vh-4rem)]
        `}>
                    <nav className="p-4 space-y-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path ||
                                (item.path === '/manuals' && location.pathname.startsWith('/manuals'));

                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    onClick={() => setSidebarOpen(false)}
                                    className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                    ${isActive
                                            ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25'
                                            : 'text-gray-600 hover:bg-gray-100'
                                        }
                  `}
                                >
                                    <Icon size={20} />
                                    <span className="font-medium">{item.label}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="absolute bottom-4 left-4 right-4">
                        <button
                            onClick={handleLogoutClick}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors"
                        >
                            <LogOut size={20} />
                            <span className="font-medium">ログアウト</span>
                        </button>
                    </div>
                </aside>

                {/* Overlay */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Main content */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-4rem)]">
                    <div className="max-w-6xl mx-auto">
                        {children}
                    </div>
                </main>
            </div>

            {/* Logout Confirmation Modal */}
            {showLogoutModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
                        onClick={() => setShowLogoutModal(false)}
                    />
                    <div className="relative bg-white rounded-3xl shadow-2xl shadow-slate-200 w-full max-w-sm overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
                        <div className="p-8 text-center">
                            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <LogOut className="text-red-500" size={32} />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 mb-2">ログアウトしますか？</h3>
                            <p className="text-slate-500 text-sm leading-relaxed mb-8">
                                セッションを終了します。再度利用するにはログインが必要です。
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setShowLogoutModal(false)}
                                    className="px-6 py-3.5 rounded-2xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all duration-200"
                                >
                                    キャンセル
                                </button>
                                <button
                                    onClick={confirmLogout}
                                    className="px-6 py-3.5 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-200 transition-all duration-200"
                                >
                                    ログアウト
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

