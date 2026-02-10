import { HTMLAttributes, forwardRef } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'elevated' | 'filled' | 'outlined';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ className = '', variant = 'elevated', children, ...props }, ref) => {
        const baseStyles = 'bg-white rounded-xl shadow-none border border-m3-outline-variant/30 transition-all duration-200';

        const variantStyles = {
            elevated: 'shadow-m3-1 border-transparent bg-m3-surface-container-low',
            filled: 'bg-m3-surface-container-highest border-none',
            outlined: 'border border-m3-outline-variant bg-transparent'
        };

        return (
            <div
                ref={ref}
                className={`${baseStyles} ${variantStyles[variant]} ${className}`}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = 'Card';
