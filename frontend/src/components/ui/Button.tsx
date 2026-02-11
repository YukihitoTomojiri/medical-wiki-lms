import React, { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'filled' | 'tonal' | 'outlined' | 'text' | 'elevated' | 'danger';
    size?: 'sm' | 'md' | 'lg' | 'default';
    icon?: React.ReactNode;
    isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', variant = 'filled', size = 'default', isLoading, icon, children, ...props }, ref) => {
        const baseStyles = 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-m3-primary disabled:opacity-50 disabled:cursor-not-allowed';

        const variantStyles: Record<string, string> = {
            filled: 'bg-m3-primary text-m3-on-primary hover:shadow-m3-1 active:shadow-m3-0 hover:brightness-110',
            tonal: 'bg-m3-secondary-container text-m3-on-secondary-container hover:shadow-m3-1 active:shadow-m3-0 hover:brightness-95',
            outlined: 'border border-m3-outline text-m3-primary hover:bg-m3-primary/5 active:bg-m3-primary/10',
            text: 'text-m3-primary hover:bg-m3-primary/5 active:bg-m3-primary/10 min-w-0 px-2',
            elevated: 'bg-m3-surface-container-low text-m3-primary shadow-m3-1 hover:shadow-m3-2 active:shadow-m3-1',
            danger: 'bg-m3-error text-m3-on-error hover:shadow-m3-1 active:shadow-m3-0 hover:brightness-110',
            primary: 'bg-m3-primary text-m3-on-primary hover:shadow-m3-1 active:shadow-m3-0 hover:brightness-110',
        };

        // M3 Shape: Full rounded (pill) for all button sizes
        const sizeStyles: Record<string, string> = {
            default: 'h-10 px-6 py-2 rounded-full text-sm',
            sm: 'h-9 px-4 rounded-full text-xs',
            md: 'h-10 px-6 py-2 rounded-full text-sm',
            lg: 'h-12 px-8 rounded-full text-base',
            icon: 'h-10 w-10 rounded-full p-2 flex items-center justify-center',
        };

        const currentSizeStyle = sizeStyles[size || 'default'] || sizeStyles.default;

        return (
            <button
                ref={ref}
                className={`${baseStyles} ${variantStyles[variant]} ${currentSizeStyle} ${className}`}
                disabled={isLoading || props.disabled}
                {...props}
            >
                {isLoading && (
                    <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                )}
                {!isLoading && icon && <span className="text-current">{icon}</span>}
                {children}
            </button>
        );
    }
);

Button.displayName = 'Button';
