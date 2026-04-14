/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./contexts/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
    "./*.{tsx,ts}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: 'rgb(var(--color-primary) / <alpha-value>)',
          'primary-dark': 'rgb(var(--color-primary-dark) / <alpha-value>)',
          secondary: 'rgb(var(--color-secondary) / <alpha-value>)',
          'secondary-dark': 'rgb(var(--color-secondary-dark) / <alpha-value>)',

          background: 'rgb(var(--bg-app) / <alpha-value>)',
          surface: 'rgb(var(--bg-surface) / <alpha-value>)',
          subtle: 'rgb(var(--bg-subtle) / <alpha-value>)',

          // Semantic text colors
          forest: 'rgb(var(--text-primary) / <alpha-value>)',
          muted: 'rgb(var(--text-muted) / <alpha-value>)',
          inverse: 'rgb(var(--text-inverse) / <alpha-value>)',

          border: 'rgb(var(--border-subtle) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['"Outfit"', '"Plus Jakarta Sans"', 'sans-serif'],
        arabic: ['"IBM Plex Sans Arabic"', 'sans-serif'],
        quran: ['Amiri', 'serif'],
      },
      boxShadow: {
        'glass': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'premium': '0 10px 40px -10px rgba(4, 120, 87, 0.1)',
        'glow': '0 0 20px rgba(217, 119, 6, 0.15)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'inner-glow': 'inset 0 0 15px rgba(255, 255, 255, 0.2)',
        // Explicit colored shadows for buttons to avoid alpha-variable issues
        'primary': '0 4px 14px 0 rgba(4, 120, 87, 0.4)',
        'primary-lg': '0 10px 25px -3px rgba(4, 120, 87, 0.5)',
        'soft-xl': '0 15px 35px -5px rgba(4, 120, 87, 0.15)',
      },
      backgroundImage: {
        'gradient-mesh': 'radial-gradient(at top right, rgba(4, 120, 87, 0.08), transparent 40%), radial-gradient(at bottom left, rgba(217, 119, 6, 0.05), transparent 40%)',
      }
    },
  },
  plugins: [],
}