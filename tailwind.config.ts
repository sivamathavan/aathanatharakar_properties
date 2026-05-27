import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // PRIMARY — Deep Navy
        navy: {
          50:  '#E8EDF5',
          100: '#C5D0E6',
          200: '#9FAFD4',
          300: '#7A8EC2',
          400: '#5B72B3',
          500: '#3D57A4',
          600: '#2C4490',
          700: '#1E3278',
          800: '#132360',
          900: '#0D1B2A',  // ← main dark navy (hero bg, sidebar)
          950: '#080F1A',
        },
        // ACCENT — Antique Gold
        gold: {
          50:  '#FDF8E8',
          100: '#FAF0C0',
          200: '#F5E090',
          300: '#EDCA58',
          400: '#E0B030',
          500: '#D4A017',  // ← main gold (buttons, highlights)
          600: '#B8880E',
          700: '#9A6F08',
          800: '#7D5A05',
          900: '#5C4003',
        },
        // BACKGROUND
        cream: {
          50:  '#FFFDF7',
          100: '#FDF8E8',  // ← main page background
          200: '#FAF0C8',
          300: '#F5E5A0',
        },
        // SUPPORTING
        slate: {
          850: '#1A2744',  // ← admin sidebar
          900: '#111827',
        },
        // STATUS COLORS (keep standard)
        success: '#1E8449',
        warning: '#D4A017',
        danger:  '#C0392B',
        info:    '#1A5276',
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        sans:    ['DM Sans', 'system-ui', 'sans-serif'],
        tamil:   ['Noto Sans Tamil', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'hero-tamil': ['clamp(1.5rem, 5vw, 2.5rem)', { lineHeight: '1.3' }],
        'hero-en':    ['clamp(0.9rem, 2.5vw, 1.15rem)', { lineHeight: '1.6' }],
      },
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
      spacing: {
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-top':    'env(safe-area-inset-top)',
      },
      borderRadius: {
        'card': '12px',
        'btn':  '8px',
        'pill': '999px',
      },
    },
  },
  plugins: [],
}

export default config
