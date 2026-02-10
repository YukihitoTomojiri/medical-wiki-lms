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
    iconColor = "text-gray-600",
    iconBgColor = "bg-gray-100",
    actions
}: PageHeaderProps) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
                {Icon && (
                    <div className={`p-3 rounded-xl ${iconBgColor} ${iconColor}`}>
                        <Icon size={24} />
                    </div>
                )}
                <div>
                    <h1 className="text-2xl font-black text-gray-800 tracking-tight">{title}</h1>
                    {description && (
                        <p className="text-sm font-medium text-gray-500 mt-1">{description}</p>
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
