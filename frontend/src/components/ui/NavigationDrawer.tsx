
import { NavLink, useLocation } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { User } from '../../types';

interface NavItem {
    label: string;
    icon: LucideIcon;
    path: string;
    roles?: string[]; // Allowed roles
    end?: boolean;    // Strict match (exact path)
}

interface NavigationDrawerProps {
    items: NavItem[];
    user: User | null;
    onItemClick?: () => void;
}

export const NavigationDrawer = ({ items, user, onItemClick }: NavigationDrawerProps) => {
    const location = useLocation();

    // Filter items based on user role
    const filteredItems = items.filter(item => {
        if (!item.roles) return true;
        if (!user) return false;
        return item.roles.includes(user.role);
    });

    return (
        <nav className="flex flex-col gap-0.5 py-2">
            {filteredItems.map((item) => {
                // Determine active state
                // If 'end' is true, use exact match
                // Otherwise, use startsWith for sub-routes
                const currentPath = location.pathname;
                let isActive = false;

                if (item.end) {
                    isActive = currentPath === item.path;
                } else {
                    isActive = currentPath === item.path || currentPath.startsWith(item.path + '/');
                }

                return (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.end}
                        onClick={onItemClick}
                        className={`
                            flex items-center gap-3 h-14 px-6 mx-3 rounded-full transition-all duration-200 group
                            ${isActive
                                ? 'bg-m3-secondary-container text-m3-on-secondary-container font-bold'
                                : 'text-m3-on-surface-variant hover:bg-m3-on-surface/8 hover:text-m3-on-surface'
                            }
                        `}
                    >
                        <item.icon
                            size={24}
                            strokeWidth={isActive ? 2.5 : 1.8}
                            className="transition-all duration-200"
                        />
                        <span className="text-sm tracking-wide">{item.label}</span>
                    </NavLink>
                );
            })}
        </nav>
    );
};
