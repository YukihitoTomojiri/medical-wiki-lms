
import { NavLink, useLocation } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { User } from '../../types';

interface NavItem {
    label: string;
    icon: LucideIcon;
    path: string;
    roles?: string[]; // Allowed roles
}

interface NavigationDrawerProps {
    items: NavItem[];
    user: User | null;
}

export const NavigationDrawer = ({ items, user }: NavigationDrawerProps) => {
    const location = useLocation();

    // Filter items based on user role
    const filteredItems = items.filter(item => {
        if (!item.roles) return true;
        if (!user) return false;
        return item.roles.includes(user.role);
    });

    return (
        <nav className="flex flex-col gap-1 py-2">
            {filteredItems.map((item) => {
                const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');

                return (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) => `
                            flex items - center gap - 3 px - 6 py - 4 mx - 3 rounded - full transition - all duration - 200
                            ${isActive
                                ? 'bg-m3-secondary-container text-m3-on-secondary-container font-bold'
                                : 'text-m3-on-surface-variant hover:bg-m3-surface-variant/50 hover:text-m3-on-surface'
                            }
`}
                    >
                        <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                        <span className="text-sm tracking-wide">{item.label}</span>
                    </NavLink>
                );
            })}
        </nav>
    );
};
