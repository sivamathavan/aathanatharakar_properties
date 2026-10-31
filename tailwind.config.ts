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
        // PRIMARY — deep teal. The token keeps the name "navy" so existing classes work.
        navy: {
          50:  '#E7F1F0',
          100: '#C4DEDB',
          200: '#9CC7C2',
          300: '#6FAEA7',
          400: '#4A968E',
          500: '#2E7D75',
          600: '#22665F',
          700: '#1A524C',
          800: '#133F3B',
          900: '#0C2B29',  // ← main dark (hero, header, sidebar)
          950: '#071A19',
        },
        // ACCENT — saffron. Token name "gold" kept for the same reason.
        gold: {
          50:  '#F8F6F0',
          100: '#FDEBC4',
          200: '#FAD78C',
          300: '#F5C056',
          400: '#EFA92E',
          500: '#E39614',  // ← main accent (buttons, highlights)
          600: '#C47C0B',
          700: '#9E6208',
          800: '#7A4B07',
          900: '#573505',
        },
        // BACKGROUND
        cream: {
          50:  '#FFFEFA',
          100: '#F8F6F0',  // ← main page background
          200: '#EFEBDF',
          300: '#E4DDCB',
        },
        // SUPPORTING
        slate: {
          850: '#10332F',  // ← admin sidebar
          900: '#111827',
        },
        // Tracker (back office) — the tracker's dark theme mapped onto the product palette
        brand: {
          dark: '#071A19',
          card: '#0C2B29',
          border: '#1A524C',
          re: '#E39614',
        },
        // STATUS COLORS (keep standard)
        success: '#1E8449',
        warning: '#E39614',
        danger:  '#C0392B',
        info:    '#1A524C',
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        heading: ['Playfair Display', 'Georgia', 'serif'],
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
