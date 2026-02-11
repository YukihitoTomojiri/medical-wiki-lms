import { ReactNode, useState } from 'react';
import {
    LogOut,
} from 'lucide-react';
import Navbar from './layout/Navbar';
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
        <div className="h-screen bg-m3-background text-m3-on-background flex flex-col">
            {/* Modern Top Navbar */}
            <Navbar
                onMenuClick={() => setSidebarOpen(true)}
                onLogout={handleLogoutClick}
            />

            <div className="flex flex-1 overflow-hidden relative">
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
                        fixed inset-y-0 left-0 z-40 w-80 bg-m3-surface-container-low transition-transform duration-300 ease-in-out shadow-xl lg:shadow-none
                        lg:relative lg:translate-x-0
                        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                    `}
                >
                    <Sidebar onClose={() => setSidebarOpen(false)} />
                </aside>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    {/* Content */}
                    <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto">
                        <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
                            {children}
                        </div>
                    </main>
                </div>
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
