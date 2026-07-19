/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        /* Core zinc scale — primary surface palette */
        zinc: {
          50:  '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          850: '#1f1f23',
          900: '#18181b',
          925: '#111113',
          950: '#09090b',
        },
        /* Accent — indigo */
        indigo: {
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
        },
        /* Semantic */
        emerald: { 400: '#34d399', 500: '#10b981' },
        amber:   { 400: '#fbbf24', 500: '#f59e0b' },
        rose:    { 400: '#fb7185', 500: '#f43f5e' },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['var(--font-outfit)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '10': ['10px', { lineHeight: '14px' }],
        '11': ['11px', { lineHeight: '16px' }],
        '12': ['12px', { lineHeight: '18px' }],
        '13': ['13px', { lineHeight: '20px' }],
        '14': ['14px', { lineHeight: '20px' }],
        '15': ['15px', { lineHeight: '22px' }],
      },
      animation: {
        'fade-up': 'fade-up 0.35s cubic-bezier(0.4,0,0.2,1) forwards',
        'fade-in': 'fade-in 0.25s ease forwards',
        'spin-slow': 'spin 1s linear infinite',
        'pulse-dot': 'pulse-dot 1.5s ease-in-out infinite',
      },
      keyframes: {
        'fade-up': {
          'from': { opacity: '0', transform: 'translateY(10px)' },
          'to':   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          'from': { opacity: '0' },
          'to':   { opacity: '1' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%':       { opacity: '0.4' },
        },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};
