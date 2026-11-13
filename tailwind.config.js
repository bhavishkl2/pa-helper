/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          500: "#0ea5e9",
          600: "#0284c7",
          900: "#0c4a6e",
        },
        slate: {
          900: "#020617",
          950: "#020a13",
        },
        green: {
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
        },
        red: {
          400: "#f87171",
          500: "#ef4444",
          600: "#dc2626",
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.25rem',
      },
    },
  },
  plugins: [],
}
