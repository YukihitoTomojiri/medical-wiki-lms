/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // === WikiLMS デザインシステム ===
                // メインアクセント（信頼感のあるオレンジ）
                primary: {
                    50: '#fff7ed',
                    100: '#ffedd5',
                    200: '#fed7aa',
                    300: '#fdba74',
                    400: '#fb923c',
                    500: '#f97316',
                    600: '#ea580c',   // ← メインアクセント
                    700: '#c2410c',
                    800: '#9a3412',
                    900: '#7c2d12',
                },
                // レガシー互換（primary と同義）
                medical: {
                    light: '#ffedd5', // primary-100
                    DEFAULT: '#ea580c', // primary-600
                    dark: '#c2410c',  // primary-700
                },
                // セマンティック
                success: '#10b981',   // emerald-500
                warning: '#f59e0b',   // amber-500
                danger: '#ef4444',    // red-500
                info: '#3b82f6',      // blue-500
            },
            borderRadius: {
                'card': '1rem',       // カード用共通角丸
            },
            boxShadow: {
                'card': '0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
                'card-hover': '0 10px 25px -5px rgb(0 0 0 / 0.08)',
            }
        },
    },
    plugins: [],
}
