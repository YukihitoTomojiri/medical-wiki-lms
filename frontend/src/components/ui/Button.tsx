import React, { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'filled' | 'tonal' | 'outlined' | 'text' | 'elevated' | 'danger';
    size?: 'sm' | 'md' | 'lg' | 'default';
    icon?: React.ReactNode;
    isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', variant = 'primary', size = 'default', isLoading, icon, children, ...props }, ref) => {
        const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-m3-primary disabled:opacity-50 disabled:cursor-not-allowed';

        const variantStyles: Record<string, string> = {
            filled: 'bg-m3-primary text-m3-on-primary hover:bg-opacity-90 active:bg-opacity-80 shadow-sm hover:shadow active:shadow-none',
            tonal: 'bg-m3-secondary-container text-m3-on-secondary-container hover:bg-opacity-80 active:bg-opacity-70',
            outlined: 'border border-m3-outline text-m3-primary hover:bg-m3-primary hover:bg-opacity-5 active:bg-opacity-10',
            text: 'text-m3-primary hover:bg-m3-primary hover:bg-opacity-5 active:bg-opacity-10 min-w-0 px-2',
            elevated: 'bg-m3-surface-container-low text-m3-primary shadow hover:shadow-md active:shadow-sm',
            danger: 'bg-m3-error text-m3-on-error hover:bg-opacity-90 shadow-sm',
            primary: 'bg-m3-primary text-m3-on-primary hover:bg-opacity-90 active:bg-opacity-80 shadow-sm hover:shadow active:shadow-none' // Alias for default
        };

        // M3 Elevation & Shape (Full rounded for buttons usually, or XL)
        const sizeStyles: Record<string, string> = {
            default: 'h-10 px-4 py-2 rounded-full', // Pill shape for buttons
            sm: 'h-9 px-3 rounded-full text-xs',
            md: 'h-10 px-4 py-2 rounded-full', // 'md' maps to default
            lg: 'h-12 px-8 rounded-full',
            icon: 'h-10 w-10 rounded-full p-2 flex items-center justify-center'
        };

        const currentSizeStyle = sizeStyles[size || 'default'] || sizeStyles.default;

        return (
            <button
                ref={ref}
                className={`${baseStyles} ${variantStyles[variant]} ${currentSizeStyle} ${className}`}
                disabled={isLoading || props.disabled}
                {...props}
            >
                {icon && <span className="text-current">{icon}</span>}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';
