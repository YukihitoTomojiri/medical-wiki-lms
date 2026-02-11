import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    iconColor?: string;
    iconBgColor?: string;
    actions?: React.ReactNode;
}

export default function PageHeader({
    title,
    description,
    icon: Icon,
    iconColor = "text-m3-on-secondary-container",
    iconBgColor = "bg-m3-secondary-container",
    actions
}: PageHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
                {Icon && (
                    <div className={`p-3 rounded-2xl ${iconBgColor} ${iconColor} transition-colors`}>
                        <Icon size={24} />
                    </div>
                )}
                <div>
                    <h1 className="text-2xl font-black text-m3-on-surface tracking-tight">{title}</h1>
                    {description && (
                        <p className="text-sm font-medium text-m3-on-surface-variant mt-0.5">{description}</p>
                    )}
                </div>
            </div>
            {actions && (
                <div className="flex items-center gap-3">
                    {actions}
                </div>
            )}
        </div>
    );
}
