/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          50: '#f8fafc',
          100: '#1e1e2e',
          200: '#181825',
          300: '#11111b',
          400: '#0d0d17',
        }
      }
    },
  },
  plugins: [],
}
