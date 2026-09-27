/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'sky-top': '#AEE1FB',
        'sky-bottom': '#E8F6FF',
        pink: '#FBD9E6',
        'pink-deep': '#F7B8D2',
        cream: '#FFFBF6',
        'cream-dim': '#FFF3E8',
        ink: '#234065',
        'ink-soft': '#5B7290',
        accent: '#FF9E6D',
        'accent-deep': '#F97F49',
        yellow: '#FFD873',
        white: '#FFFFFF',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        body: ['Karla', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 20px 45px -15px rgba(35, 64, 101, 0.18)',
        card: '0 10px 30px -8px rgba(35, 64, 101, 0.14)',
      },
      borderRadius: {
        xl2: '1.75rem',
      },
    },
  },
  plugins: [],
};
