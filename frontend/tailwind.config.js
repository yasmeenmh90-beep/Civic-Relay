/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        surface: {
          DEFAULT: 'var(--color-surface)',
          raised: 'var(--color-surface-raised)',
          elevated: 'var(--color-surface-elevated)',
        },
        foreground: {
          DEFAULT: 'var(--color-foreground)',
          secondary: 'var(--color-foreground-secondary)',
          muted: 'var(--color-foreground-muted)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          subtle: 'var(--color-border-subtle)',
          glow: 'rgba(0, 217, 255, 0.4)',
        },
        neon: {
          cyan: '#00D9FF',
          mint: '#5CFFB0',
          purple: '#9B8CFF',
        },
        warning: {
          DEFAULT: '#FFB84D',
          light: '#FFF6E6',
          dark: '#3D2800',
        },
        danger: {
          DEFAULT: '#FF6B81',
          light: '#FFEBEF',
          dark: '#3D0D14',
        },
        success: {
          DEFAULT: '#35D07F',
          light: '#EAFBF2',
          dark: '#08331E',
        },
        // Legacy backward compatibility mappings
        bg: {
          primary: 'var(--color-background)',
          secondary: 'var(--color-surface-raised)',
        },
        card: 'var(--color-surface)',
        text: {
          primary: 'var(--color-foreground)',
          secondary: 'var(--color-foreground-secondary)',
          muted: 'var(--color-foreground-muted)',
        },
      },
      boxShadow: {
        'subtle': 'var(--shadow-subtle)',
        'card': 'var(--shadow-card)',
        '3d-flat': '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
        '3d-hover': '0 20px 30px -10px rgba(0, 0, 0, 0.3), 0 0 15px -3px rgba(0, 217, 255, 0.15)',
        '3d-lifted': '0 16px 32px -8px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)',
        'glow-cyan': '0 0 24px -2px rgba(0, 217, 255, 0.4)',
        'glow-mint': '0 0 24px -2px rgba(92, 255, 176, 0.4)',
        'glow-purple': '0 0 24px -2px rgba(155, 140, 255, 0.4)',
        'glow-warning': '0 0 24px -2px rgba(255, 184, 77, 0.4)',
        'glow-danger': '0 0 24px -2px rgba(255, 107, 129, 0.4)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)', boxShadow: '0 0 20px 2px rgba(0, 217, 255, 0.4)' },
          '50%': { opacity: '0.8', transform: 'scale(1.03)', boxShadow: '0 0 30px 6px rgba(92, 255, 176, 0.5)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
}
