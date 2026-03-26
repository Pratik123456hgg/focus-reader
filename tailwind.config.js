/** @type {import('tailwindcss').Config} */
export default {
    content: ['./popup.html', './src/**/*.{ts,tsx}'],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                // Primary & Secondary Brand Colors
                primary: {
                    50: '#f5f3ff',
                    100: '#ede9fe',
                    200: '#ddd6fe',
                    300: '#c4b5fd',
                    400: '#a78bfa',
                    500: '#6C63FF',   // --primary
                    600: '#5A52E0',   // --primary-hover
                    700: '#4c45c8',
                    800: '#3d36a2',
                    900: '#332f83',
                },
                secondary: {
                    50: '#e8faf9',
                    100: '#d0f4f2',
                    200: '#a5e9e5',
                    300: '#73dad4',
                    400: '#4ECDC4',   // --secondary
                    500: '#36b8ae',
                    600: '#279590',
                    700: '#1f7874',
                    800: '#195e5b',
                    900: '#144e4b',
                },
                // Neutral & Status Colors
                bg: {
                    base: '#0D1117',      // --bg-base (deepest)
                    surface: '#161B22',   // --bg-surface (cards)
                    elevated: '#1F2937',  // --bg-elevated (inputs)
                    overlay: '#263244',   // --bg-overlay (tooltips)
                },
                text: {
                    primary: '#F0F6FC',   // --text-primary
                    secondary: '#8B949E', // --text-secondary
                    muted: '#484F58',     // --text-muted
                },
                success: '#10B981',       // --success
                error: '#EF4444',         // --error
                warning: '#F59E0B',       // --warning
                border: '#30363D',        // --border
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
            },
            fontSize: {
                xs: ['10px', { lineHeight: '14px', fontWeight: '400' }],
                sm: ['12px', { lineHeight: '16px', fontWeight: '400' }],
                base: ['13px', { lineHeight: '18px', fontWeight: '500' }],
                md: ['14px', { lineHeight: '20px', fontWeight: '500' }],
                lg: ['16px', { lineHeight: '22px', fontWeight: '600' }],
                xl: ['18px', { lineHeight: '24px', fontWeight: '700' }],
                '2xl': ['22px', { lineHeight: '28px', fontWeight: '800' }],
            },
            spacing: {
                1: '4px',
                2: '8px',
                3: '12px',
                4: '16px',
                5: '20px',
                6: '24px',
            },
            borderRadius: {
                sm: '6px',
                md: '10px',
                lg: '14px',
                xl: '20px',
                full: '9999px',
            },
            boxShadow: {
                sm: '0 1px 3px rgba(0,0,0,0.4)',
                md: '0 4px 12px rgba(0,0,0,0.5)',
                glow: '0 0 20px rgba(108,99,255,0.25)',
                'teal-glow': '0 0 20px rgba(78,205,196,0.2)',
            },
            animation: {
                'spin-slow': 'spin 2s linear infinite',
                'pulse-ring': 'pulse-ring 1.5s ease-in-out infinite',
                shimmer: 'shimmer 1.5s infinite',
            },
            keyframes: {
                'pulse-ring': {
                    '0%, 100%': { transform: 'scale(1)', opacity: '1' },
                    '50%': { transform: 'scale(1.15)', opacity: '0.7' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '200% 0' },
                    '100%': { backgroundPosition: '-200% 0' },
                },
            },
            backgroundImage: {
                'gradient-primary': 'linear-gradient(135deg, #6C63FF, #4ECDC4)',
                'gradient-surface': 'linear-gradient(180deg, #161B22, #0D1117)',
                'gradient-glow': 'radial-gradient(ellipse at top, rgba(108,99,255,0.12), transparent 70%)',
            },
            letterSpacing: {
                tighter: '-0.3px',
                'uppercase': '0.08em',
            },
        },
    },
    plugins: [],
};
