import { ReactNode, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { User } from '../types';
import {
    BookOpen,
    LogOut,
    Menu,
    X,
    Building2,
} from 'lucide-react';
import Sidebar from './Sidebar';

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



    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center gap-4">
                            <button
                                className="lg:hidden p-2.5 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                            >
                                {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
                            </button>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-600/20">
                                    <BookOpen className="text-white" size={20} />
                                </div>
                                <div className="hidden sm:block">
                                    <h1 className="text-sm font-black text-slate-800 tracking-tighter uppercase">
                                        Medical Wiki
                                    </h1>
                                    <p className="text-[10px] font-bold text-slate-400 -mt-0.5 uppercase tracking-widest">LMS Network</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {user.role === 'DEVELOPER' && location.pathname.startsWith('/admin') && (
                                <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-lg">
                                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                                    <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Developer Access</span>
                                </div>
                            )}
                            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-full">
                                <Building2 size={12} className="text-slate-400" />
                                <span className="text-xs font-bold text-slate-600 tracking-tight">{user.facility}</span>
                            </div>
                            <div className="flex items-center gap-3 pl-2 border-l border-slate-100">
                                <div className="hidden sm:block text-right">
                                    <p className="text-xs font-black text-slate-800 tracking-tight">{user.name}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        {user.role === 'DEVELOPER' ? 'Developer' : user.role === 'ADMIN' ? 'Admin' : 'Staff'}
                                    </p>
                                </div>
                                <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-black text-xs border border-slate-200">
                                    {user.name.charAt(0)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="flex max-w-7xl mx-auto">
                {/* Sidebar - Desktop */}
                <aside className={`
                    fixed lg:sticky lg:top-16 inset-y-0 left-0 z-40
                    w-64 bg-white border-r border-slate-100
                    transform transition-transform duration-300 ease-in-out
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    lg:h-[calc(100vh-4rem)] lg:bg-transparent lg:border-none
                `}>
                    <Sidebar user={user} onLogout={handleLogoutClick} onClose={() => setSidebarOpen(false)} />
                </aside>

                {/* Overlay */}
                {sidebarOpen && (
                    <div
                        className="fixed inset-0 bg-slate-900/10 backdrop-blur-sm z-30 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}

                {/* Main content */}
                <main className="flex-1 p-4 sm:p-6 lg:p-8 min-h-[calc(100vh-4rem)]">
                    <div className="max-w-5xl mx-auto">
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

