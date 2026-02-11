import { InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    variant?: 'outlined' | 'filled';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ className = '', label, error, variant = 'outlined', ...props }, ref) => {

        const variantStyles = {
            outlined: `
                w-full h-14 px-4 pt-4 pb-2 text-sm rounded-m3-lg
                border border-m3-outline-variant bg-transparent
                text-m3-on-surface placeholder:text-m3-on-surface-variant/50
                focus:outline-none focus:border-m3-primary focus:border-2 focus:ring-0
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200
            `,
            filled: `
                w-full h-14 px-4 pt-4 pb-2 text-sm
                rounded-t-m3-lg rounded-b-none
                bg-m3-surface-container-highest border-b-2 border-m3-on-surface-variant
                text-m3-on-surface placeholder:text-m3-on-surface-variant/50
                focus:outline-none focus:border-b-m3-primary focus:bg-m3-surface-container-high
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200
            `,
        };

        const errorBorder = error
            ? 'border-m3-error focus:border-m3-error'
            : '';

        return (
            <div className="w-full relative">
                {label && (
                    <label className="block text-xs font-medium text-m3-on-surface-variant mb-1.5 ml-1 tracking-wide">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    className={`${variantStyles[variant]} ${errorBorder} ${className}`}
                    {...props}
                />
                {error && (
                    <p className="mt-1 ml-1 text-xs text-m3-error font-medium">{error}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
