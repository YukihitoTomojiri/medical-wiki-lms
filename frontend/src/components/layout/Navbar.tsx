import { Menu } from 'lucide-react';
import Logo from '../common/Logo';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
    onMenuClick?: () => void;
}

const Navbar = ({ onMenuClick }: NavbarProps) => {
    const { user } = useAuth();

    return (
        <nav className="bg-m3-header-bg text-white px-4 md:px-6 py-3 flex items-center justify-between shadow-lg z-50 relative">
            <div className="flex items-center gap-4 md:gap-8">
                {/* Mobile Menu Button */}
                <button
                    onClick={onMenuClick}
                    className="p-1 text-white hover:bg-white/10 rounded-lg lg:hidden"
                >
                    <Menu size={24} />
                </button>

                <Logo />

                <div className="hidden md:flex items-center gap-2 text-m3-header-text/60 text-sm font-medium border-l border-white/10 pl-6 h-8">
                    <span className="text-orange-400 text-lg">🥼</span>
                    <span>専門知識で、現場を守る。</span>
                </div>
            </div>

            <div className="flex items-center gap-4 md:gap-6">
                <div className="flex items-center gap-4 text-sm font-bold text-m3-header-text/80">
                    <button className="hidden sm:block hover:text-white transition-colors">ABOUT</button>

                    {/* User Profile */}
                    {user && (
                        <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                            <div className="text-right hidden sm:block">
                                <div className="text-xs text-orange-200/70">{user.facility}</div>
                                <div className="text-white leading-none">{user.name}</div>
                            </div>
                            <div className="w-9 h-9 rounded-full bg-orange-200 text-orange-900 flex items-center justify-center font-bold text-sm shadow-inner ring-2 ring-white/20">
                                {user.name.charAt(0)}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
