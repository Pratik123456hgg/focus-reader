/** @type {import('tailwindcss').Config} */
export default {
    content: ['./popup.html', './src/**/*.{ts,tsx}'],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                purple: {
                    50: '#f3f2ff',
                    100: '#ece9ff',
                    200: '#d9d5fe',
                    300: '#b9b0fd',
                    400: '#9388fc',
                    500: '#6C63FF',
                    600: '#5a50e6',
                    700: '#4a41c8',
                    800: '#3d36a2',
                    900: '#332f83',
                },
                teal: {
                    50: '#e8faf9',
                    100: '#d0f4f2',
                    200: '#a5e9e5',
                    300: '#73dad4',
                    400: '#4ECDC4',
                    500: '#36b8ae',
                    600: '#279590',
                    700: '#1f7874',
                    800: '#195e5b',
                    900: '#144e4b',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
            },
            animation: {
                'spin-slow': 'spin 2s linear infinite',
                'pulse-ring': 'pulse-ring 1.5s ease-in-out infinite',
            },
            keyframes: {
                'pulse-ring': {
                    '0%, 100%': { transform: 'scale(1)', opacity: '1' },
                    '50%': { transform: 'scale(1.15)', opacity: '0.7' },
                },
            },
        },
    },
    plugins: [],
};
