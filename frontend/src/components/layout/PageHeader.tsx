import { LucideIcon } from 'lucide-react';
import React from 'react';

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    icon?: LucideIcon;
    children?: React.ReactNode;
}

const PageHeader = ({ title, subtitle, icon: Icon, children }: PageHeaderProps) => {
    return (
        <div className="relative overflow-hidden mb-8">
            {/* M3スタイルの帯（Hero Section） */}
            <div className="bg-orange-100 dark:bg-m3-orange-secondary-container rounded-[28px] p-8 flex flex-col md:flex-row items-center justify-between border border-orange-200 shadow-sm relative z-10">
                <div className="flex flex-col gap-2 z-10 w-full md:w-auto">
                    <div className="flex items-center gap-3">
                        {Icon && <Icon className="w-8 h-8 text-orange-700" />}
                        <h1 className="text-3xl font-bold text-orange-900 tracking-tight">
                            {title}
                        </h1>
                    </div>
                    {subtitle && (
                        <p className="text-orange-800/80 font-medium ml-1">
                            {subtitle}
                        </p>
                    )}
                </div>

                {children && (
                    <div className="mt-4 md:mt-0 z-10">
                        {children}
                    </div>
                )}

                {/* 装飾用のポップな円形要素 */}
                <div className="absolute -right-4 -top-4 w-32 h-32 bg-orange-200/50 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute right-12 bottom-0 w-16 h-16 bg-orange-300/30 rounded-full blur-xl pointer-events-none" />
            </div>
        </div>
    );
};

export default PageHeader;
