import { InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    variant?: 'outlined' | 'filled';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', label, error, variant = 'outlined', ...props }, ref) => {
        // M3 Input Styles
        // Outlined: Border, rounded-4px (small) or rounded-md (12px). M3 Outlined text field usually has 4px radius. 
        // But let's stick to our system: rounded-lg (12px) for friendliness.

        const baseStyles = `flex h-12 w-full rounded-md border border-m3-outline border-opacity-40 bg-m3-surface-container-lowest px-3 py-2 text-sm ring-offset-m3-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-m3-on-surface-variant/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-m3-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 ease-in-out`;

        const variantStyles = {
            outlined: 'border border-m3-outline rounded-lg focus:border-m3-primary focus:ring-1 focus:ring-m3-primary',
            filled: 'bg-m3-surface-container-highest rounded-t-lg border-b border-m3-outline focus:border-m3-primary',
        };

        const errorStyles = error ? 'border-m3-error focus:border-m3-error focus:ring-m3-error' : '';

        return (
            <div className="w-full">
                {label && (
                    <label className="block text-xs font-medium text-m3-on-surface-variant mb-1.5 ml-1">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    className={`${baseStyles} ${variantStyles[variant]} ${errorStyles} ${className}`}
                    {...props}
                />
                {error && (
                    <p className="mt-1 ml-1 text-xs text-m3-error">{error}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
