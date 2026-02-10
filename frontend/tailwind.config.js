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
                'm3-background': '#FBFCFD',
                'm3-on-background': '#191C1C',
                'm3-surface': '#F0F4F4',
                'm3-on-surface': '#191C1C',
                'm3-surface-container': '#F0F4F4',
                'm3-surface-container-low': '#F6FBF9', // Needed based on previous files
                'm3-surface-container-highest': '#E4E9E9', // Needed based on previous files
                'm3-surface-variant': '#DAE5E4', // Needed based on previous files
                'm3-on-surface-variant': '#3F4948', // Needed based on previous files
                'm3-outline': '#6F7979',
                'm3-outline-variant': '#BFC9C8', // Needed based on previous files
                'm3-error': '#BA1A1A', // Needed based on previous files
                'm3-on-error': '#FFFFFF', // Needed based on previous files
                'm3-inverse-surface': '#2E3131', // Needed based on previous files
                'm3-inverse-on-surface': '#F0F1F0', // Needed based on previous files
                'm3-inverse-primary': '#82D5C8', // Needed based on previous files

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
            },
            borderRadius: {
                'md': '0.75rem',    // 12px
                'xl': '1.75rem',    // 28px
                'full': '9999px',
            },
            fontFamily: {
                sans: ['"Noto Sans JP"', 'sans-serif'],
            },
            boxShadow: {
                'm3-1': '0px 1px 3px 1px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30)',
                'm3-2': '0px 2px 6px 2px rgba(0, 0, 0, 0.15), 0px 1px 2px 0px rgba(0, 0, 0, 0.30)',
            },
        },
    },
    plugins: [],
}
