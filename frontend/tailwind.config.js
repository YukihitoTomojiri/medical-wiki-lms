/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // === M3 Medical Theme ===
                'm3-primary': '#006A6A',
                'm3-on-primary': '#FFFFFF',
                'm3-primary-container': '#9EF2E4',
                'm3-on-primary-container': '#002020',
                'm3-secondary': '#4A6363',
                'm3-on-secondary': '#FFFFFF',
                'm3-secondary-container': '#CCE8E7',
                'm3-on-secondary-container': '#052020',
                'm3-tertiary': '#4A607B',
                'm3-on-tertiary': '#FFFFFF',
                'm3-tertiary-container': '#D1E4FF',
                'm3-on-tertiary-container': '#031E35',
                'm3-background': '#FBFCFD',
                'm3-on-background': '#191C1C',
                'm3-surface': '#F0F4F4',
                'm3-on-surface': '#191C1C',
                'm3-surface-container': '#F0F4F4',
                'm3-surface-container-low': '#F6FBF9',
                'm3-surface-container-high': '#E1E3E3',
                'm3-surface-container-highest': '#E4E9E9',
                'm3-surface-variant': '#DAE5E4',
                'm3-on-surface-variant': '#3F4948',
                'm3-outline': '#6F7979',
                'm3-outline-variant': '#BFC9C8',
                'm3-error': '#BA1A1A',
                'm3-on-error': '#FFFFFF',
                'm3-error-container': '#FFDAD6',
                'm3-on-error-container': '#410002',
                'm3-inverse-surface': '#2E3131',
                'm3-inverse-on-surface': '#F0F1F0',
                'm3-inverse-primary': '#82D5C8',

                // === M3 Warm Orange Theme ===
                'm3-orange-primary': '#FF9800',
                'm3-orange-on-primary': '#FFFFFF',
                'm3-orange-primary-container': '#FFDDB3',
                'm3-orange-on-primary-container': '#291800',
                'm3-orange-secondary': '#765A2D',
                'm3-orange-on-secondary': '#FFFFFF',
                'm3-orange-secondary-container': '#FFDDB3',
                'm3-orange-tertiary': '#4D6544',
                'm3-orange-background': '#FFFBFF',
                'm3-orange-surface': '#FFFBFF',
                'm3-orange-outline': '#827568',

                // === Modern Header ===
                'm3-header-bg': '#2D1600',
                'm3-header-text': '#FFFFFF',
                'm3-header-text-secondary': '#FFDDB3',
            },
            borderRadius: {
                // M3 Shape Scale
                'm3-none': '0px',
                'm3-xs': '4px',
                'm3-sm': '8px',
                'm3-md': '12px',
                'm3-lg': '16px',
                'm3-xl': '28px',
                'full': '9999px',
            },
            fontFamily: {
                sans: ['"Noto Sans JP"', 'sans-serif'],
            },
            boxShadow: {
                'm3-0': 'none',
                'm3-1': '0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30)',
                'm3-2': '0px 2px 6px 2px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30)',
                'm3-3': '0px 4px 8px 3px rgba(0, 0, 0, 0.15), 0px 1px 3px 0px rgba(0, 0, 0, 0.30)',
            },
        },
    },
    plugins: [],
}
