import { Menu } from 'lucide-react';
import Logo from '../common/Logo';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
    onMenuClick?: () => void;
}

const Navbar = ({ onMenuClick }: NavbarProps) => {
    const { user } = useAuth();

    return (
        <nav className="bg-m3-header-bg px-4 md:px-6 h-16 flex items-center justify-between shadow-lg sticky top-0 z-50">
            <div className="flex items-center gap-4 md:gap-10">
                {/* Mobile Menu Button */}
                <button
                    onClick={onMenuClick}
                    className="p-1 text-white hover:bg-white/10 rounded-lg lg:hidden"
                >
                    <Menu size={24} />
                </button>

                <Logo />

                {/* Micro Copy */}
                <div className="hidden lg:flex items-center gap-2 border-l border-white/10 pl-10 h-10">
                    <span className="text-sm font-medium text-orange-100/70 flex items-center gap-2">
                        <span className="animate-pulse text-orange-400">●</span>
                        想像力で、現場をアップデートする。
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-4 md:gap-6">
                <button className="text-xs font-bold text-orange-100/80 hover:text-white transition-colors tracking-widest hidden sm:block">
                    ABOUT
                </button>

                {/* User Profile */}
                {user && (
                    <div className="flex items-center gap-3 bg-white/5 py-1.5 px-3 rounded-full border border-white/10 transition-colors hover:bg-white/10 cursor-pointer">
                        <span className="text-xs font-bold text-white/90 hidden md:block">{user.facility || 'Facility'}</span>
                        <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-xs shadow-sm ring-2 ring-white/20">
                            {user.name.charAt(0)}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
