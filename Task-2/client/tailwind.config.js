/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui'] },
      animation: {
        'spin-slow': 'spin 1.5s linear infinite',
      }
    }
  },
  plugins: [],
}
