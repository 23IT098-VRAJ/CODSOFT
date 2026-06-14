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
    },
  },
  plugins: [],
};
