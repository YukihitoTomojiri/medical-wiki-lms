import React from 'react';

export interface BadgeProps {
    variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
    children: React.ReactNode;
    className?: string;
}

export const Badge = ({ variant = 'neutral', children, className = '' }: BadgeProps) => {
    // M3 Badges/Chips typically use Tonal containers
    const variantStyles = {
        success: 'bg-emerald-100 text-emerald-900', // Custom approximations for semantic colors
        warning: 'bg-amber-100 text-amber-900',
        error: 'bg-m3-error-container text-m3-on-error-container',
        info: 'bg-m3-tertiary-container text-m3-on-tertiary-container',
        neutral: 'bg-m3-surface-variant text-m3-on-surface-variant',
    };

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold leading-5 ${variantStyles[variant]} ${className}`}>
            {children}
        </span>
    );
};
