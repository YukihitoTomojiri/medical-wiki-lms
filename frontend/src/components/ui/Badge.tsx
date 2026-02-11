import React from 'react';

export interface BadgeProps {
    variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
    children: React.ReactNode;
    className?: string;
}

export const Badge = ({ variant = 'neutral', children, className = '' }: BadgeProps) => {
    // M3 Style: pill-shaped tonal badges
    const variantStyles = {
        success: 'bg-emerald-100 text-emerald-800',
        warning: 'bg-amber-100 text-amber-800',
        error: 'bg-m3-error-container text-m3-on-error-container',
        info: 'bg-m3-tertiary-container text-m3-on-tertiary-container',
        neutral: 'bg-m3-surface-variant text-m3-on-surface-variant',
    };

    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold leading-5 ${variantStyles[variant]} ${className}`}>
            {children}
        </span>
    );
};
