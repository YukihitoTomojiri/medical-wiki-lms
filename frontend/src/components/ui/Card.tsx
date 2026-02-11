import { HTMLAttributes, forwardRef } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'elevated' | 'filled' | 'outlined';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ className = '', variant = 'elevated', children, ...props }, ref) => {
        // M3 Card: Extra Large shape (28px radius), surface layering for depth
        const baseStyles = 'rounded-m3-xl transition-all duration-200';

        const variantStyles = {
            elevated: 'bg-m3-surface-container-low shadow-m3-1',
            filled: 'bg-m3-surface-container-highest shadow-m3-0',
            outlined: 'bg-m3-surface border border-m3-outline-variant shadow-m3-0',
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
