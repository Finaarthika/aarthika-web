/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aarthikaDark: "#14141e",
        aarthikaBlue: "#4745ca",
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(to right, #14141e, #4745ca)',
      }
    },
  },
  plugins: [],
} 