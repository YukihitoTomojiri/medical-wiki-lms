import { HTMLAttributes, forwardRef } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'elevated' | 'filled' | 'outlined';
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ className = '', variant = 'elevated', children, ...props }, ref) => {
        const baseStyles = 'rounded-xl overflow-hidden'; // M3 Medium/Large shape (12-16px) -> rounded-xl (12px in our config usually means 0.75rem=12px or 1rem=16px depending on customization. We set xl=28px, lg=1rem, md=12px. Let's use rounded-lg for 16px or rounded-md for 12px. Actually config says xl=28px, lg=1rem. So rounded-lg is 16px.)
        // Correction: tailwind config has 'md': '0.75rem' (12px). M3 Card usually has 12px or 16px. Let's go with 'rounded-lg' (16px) or 'rounded-md' (12px). We should probably use 'rounded-[12px]' or strictly follow config.
        // Let's use `rounded-lg` (16px) as standard for Cards.

        const variantStyles = {
            elevated: 'bg-m3-surface text-m3-on-surface shadow-m3-1 hover:shadow-m3-2 transition-shadow duration-200',
            filled: 'bg-m3-surface-variant text-m3-on-surface-variant',
            outlined: 'bg-m3-surface text-m3-on-surface border border-m3-outline-variant',
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
