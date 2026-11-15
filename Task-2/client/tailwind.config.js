/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // The "Quartz" palette, named once here instead of repeated as hex
      // codes in every component.
      colors: {
        paper: '#F7F6F4', // page background
        surface: '#FFFFFF', // cards, panels
        sunken: '#F0EFEC', // columns, wells, hover fills
        line: '#E5E2DC', // borders
        'line-strong': '#D4D0C9',
        ink: '#1A1917', // primary text and solid buttons
        'ink-soft': '#4B4845', // secondary text
        muted: '#8A8680', // labels, hints
        faint: '#BAB6B0', // placeholders
        danger: '#9B1C1C',
        'danger-soft': '#FEF2F2',
        success: '#065F46',
        'success-soft': '#ECFDF5',
        warn: '#92400E',
        'warn-soft': '#FFFBEB',
        info: '#1E40AF',
        'info-soft': '#EFF6FF',
      },
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui'] },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06)',
        lift: '0 6px 20px rgba(0,0,0,0.08)',
        overlay: '0 24px 80px rgba(0,0,0,0.14)',
      },

      // Motion house rules, applied to every `transition` utility:
      //  • colours are not in the default list, so hover colour is instant
      //  • the default curve is a strong ease-out
      //  • press and hover movement takes 180ms
      transitionProperty: {
        DEFAULT: 'opacity, box-shadow, transform, filter',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.23, 1, 0.32, 1)',
        out: 'cubic-bezier(0.23, 1, 0.32, 1)',
      },
      transitionDuration: {
        DEFAULT: '180ms',
      },
      keyframes: {
        'skeleton-sweep': {
          from: { backgroundPosition: '200% 0' },
          to: { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        'skeleton-sweep': 'skeleton-sweep 1.6s linear infinite',
      },
    },
  },
  plugins: [],
};
