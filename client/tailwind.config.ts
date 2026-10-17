import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0a',
        surface: '#111111',
        'surface-2': '#161616',
        border: '#2a2a2a',
        white: '#ffffff',
        silver: {
          DEFAULT: '#c0c0c0',
          light: '#e8e8e8',
          dark: '#8b8b8b',
        },
        muted: '#6b6b6b',
        // shadcn/ui CSS variable compatibility
        primary: {
          DEFAULT: '#c0c0c0',
          foreground: '#0a0a0a',
        },
        secondary: {
          DEFAULT: '#161616',
          foreground: '#ffffff',
        },
        destructive: {
          DEFAULT: '#8b2020',
          foreground: '#ffffff',
        },
        accent: {
          DEFAULT: '#161616',
          foreground: '#ffffff',
        },
        popover: {
          DEFAULT: '#111111',
          foreground: '#ffffff',
        },
        card: {
          DEFAULT: '#111111',
          foreground: '#ffffff',
        },
        input: '#2a2a2a',
        ring: '#c0c0c0',
        status: {
          confirmed: '#3d85c8',
          pending: '#d4a017',
          completed: '#2d7a4f',
          cancelled: '#5a5a5a',
          'no-show': '#8b2020',
        },
      },
      borderRadius: {
        lg: '0.75rem',
        md: '0.5rem',
        sm: '0.375rem',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        premium: '0 4px 30px rgba(0,0,0,0.8)',
        glow: '0 0 20px rgba(192,192,192,0.12)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'shimmer': 'shimmer 1.8s infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
}

export default config
