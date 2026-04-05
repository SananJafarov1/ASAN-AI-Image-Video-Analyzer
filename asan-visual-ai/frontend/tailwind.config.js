/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        asan: {
          blue: '#003580',
          gold: '#F5A623',
          red: '#E3001B',
        },
      },
    },
  },
  plugins: [],
}
