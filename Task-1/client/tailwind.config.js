/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        midnight: '#0B1120',
        vividGold: '#D4A017',
        pureWhite: '#FFFFFF',
        warmIvory: '#FAF7F2',
        parchment: '#EDE5D0',
        bodyInk: '#1F2937',
        smoke: '#4B5563',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      // Motion house rules, applied to every `transition` utility:
      //  • colours are not in the default property list, so a hover colour
      //    change is instant — only movement, opacity and shadow ease
      //  • the default curve is a strong ease-out (the browser's own
      //    `ease-out` is too weak to read as "settling")
      transitionProperty: {
        DEFAULT: 'opacity, box-shadow, transform, filter, backdrop-filter',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.23, 1, 0.32, 1)',
        out: 'cubic-bezier(0.23, 1, 0.32, 1)',
        'in-out': 'cubic-bezier(0.77, 0, 0.175, 1)',
      },
      transitionDuration: {
        DEFAULT: '180ms', // press and hover movement: 120–180ms
      },
      // Keyframes are reserved for things that loop or run once on their own.
      // Anything the user toggles uses a transition instead, so it can reverse.
      keyframes: {
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(calc(-100% - var(--gap)))' },
        },
        'slow-spin': {
          to: { transform: 'rotate(360deg)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(0) skewX(-20deg)' },
          '55%, 100%': { transform: 'translateX(420%) skewX(-20deg)' },
        },
        'skeleton-sweep': {
          from: { backgroundPosition: '200% 0' },
          to: { backgroundPosition: '-200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0) scale(1)' },
          '50%': { transform: 'translate3d(24px, -32px, 0) scale(1.08)' },
        },
        bob: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        marquee: 'marquee var(--duration) linear infinite',
        'slow-spin': 'slow-spin 8s linear infinite',
        shimmer: 'shimmer 2.8s ease-in-out infinite',
        'skeleton-sweep': 'skeleton-sweep 1.6s linear infinite',
        float: 'float 12s ease-in-out infinite',
        bob: 'bob 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
