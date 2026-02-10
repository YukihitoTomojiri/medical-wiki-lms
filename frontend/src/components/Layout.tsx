import { ReactNode, useState } from 'react';
import {
    Menu,
    LogOut,
    Building2,
} from 'lucide-react';
import Sidebar from './Sidebar';
import { Button } from './ui/Button';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
    children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
    // const location = useLocation();
    const { user, logout } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const handleLogoutClick = () => {
        setShowLogoutModal(true);
    };

    const confirmLogout = () => {
        setShowLogoutModal(false);
        logout();
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-m3-background text-m3-on-background flex">
            {/* Mobile Drawer Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar (Drawer) */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-50 w-80 bg-m3-surface-container-low transition-transform duration-300 ease-in-out shadow-xl lg:shadow-none
                    lg:relative lg:translate-x-0
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                <Sidebar onLogout={handleLogoutClick} onClose={() => setSidebarOpen(false)} />
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
                {/* M3 Top App Bar */}
                <header className="h-16 px-4 flex items-center justify-between bg-m3-surface/80 backdrop-blur-md sticky top-0 z-30 border-b border-m3-outline-variant/20 lg:hidden">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="p-2 text-m3-on-surface hover:bg-m3-surface-variant/30 rounded-full"
                        >
                            <Menu size={24} />
                        </button>
                        <h1 className="text-lg font-medium text-m3-on-surface">Medical Wiki</h1>
                    </div>
                </header>

                {/* Content */}
                <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
                    <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
                        {/* Desktop Header / Breadcrumb placeholder or User profile could go here if needed, 
                            but usually M3 has top bar or just content. 
                            Let's add a subtle top bar for User Profile on Desktop since Sidebar handles nav. 
                        */}
                        <div className="hidden lg:flex justify-end mb-6 items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1 bg-m3-surface-variant rounded-full text-xs font-medium text-m3-on-surface-variant">
                                <Building2 size={14} />
                                {user.facility}
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="text-right">
                                    <p className="text-sm font-bold text-m3-on-surface">{user.name}</p>
                                    <p className="text-xs text-m3-outline">{user.role}</p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-m3-primary-container text-m3-on-primary-container flex items-center justify-center font-bold text-lg">
                                    {user.name.charAt(0)}
                                </div>
                            </div>
                        </div>

                        {children}
                    </div>
                </main>
            </div>

            {/* Logout Confirmation Dialog (M3 Style) */}
            {showLogoutModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                        onClick={() => setShowLogoutModal(false)}
                    />
                    <div className="relative bg-m3-surface-container-high rounded-[28px] shadow-2xl w-full max-w-xs p-6 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center">
                            <div className="mb-4 text-m3-error">
                                <LogOut size={32} />
                            </div>
                            <h3 className="text-xl font-medium text-m3-on-surface mb-2">ログアウト?</h3>
                            <p className="text-m3-on-surface-variant text-sm mb-6">
                                アカウントからログアウトしますか？
                            </p>
                            <div className="flex gap-3 w-full">
                                <Button
                                    variant="text"
                                    onClick={() => setShowLogoutModal(false)}
                                    className="flex-1"
                                >
                                    キャンセル
                                </Button>
                                <Button
                                    variant="filled"
                                    onClick={confirmLogout}
                                    className="flex-1 bg-m3-error text-white hover:bg-red-700"
                                >
                                    ログアウト
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
