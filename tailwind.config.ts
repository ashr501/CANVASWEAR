import type {Config} from 'tailwindcss';

export default {
  content: ['./app/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: 'var(--color-bg)',
          surface: 'var(--color-surface)',
          primary: 'var(--color-primary)',
          secondary: 'var(--color-secondary)',
          accent: 'var(--color-accent)',
          text: 'var(--color-text)',
          'text-muted': 'var(--color-text-muted)',
          border: 'var(--color-border)',
        },
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['clamp(2.5rem, 6vw, 5rem)', {lineHeight: '1.05'}],
        'display-lg': ['clamp(2rem, 4vw, 3.5rem)', {lineHeight: '1.1'}],
        'display-md': ['clamp(1.5rem, 3vw, 2.5rem)', {lineHeight: '1.15'}],
      },
      spacing: {
        'section': 'var(--section-spacing)',
        'gutter': 'var(--gutter)',
      },
      transitionTimingFunction: {
        'brand': 'var(--ease)',
      },
      animation: {
        'fade-up': 'fadeUp 0.6s var(--ease) forwards',
        'fade-in': 'fadeIn 0.4s var(--ease) forwards',
      },
      keyframes: {
        fadeUp: {
          from: {opacity: '0', transform: 'translateY(24px)'},
          to: {opacity: '1', transform: 'translateY(0)'},
        },
        fadeIn: {
          from: {opacity: '0'},
          to: {opacity: '1'},
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
