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
          50:  '#E8F5EE', // soft brand background
          100: '#D1EBE0',
          200: '#A7D7C2',
          300: '#6EBCA0',
          400: '#3DA47E',
          500: '#23895A', // primary accent
          600: '#176B4A', // primary brand
          700: '#13583C',
          800: '#0F442F',
          900: '#0B3323',
          950: '#061D14',
        },
        lavender: {
          50:  '#FAF9FE',
          100: '#EEEAFB', // optional secondary lavender
          200: '#DDD6F7',
          300: '#C2B8F0',
          400: '#9B8EE3',
          500: '#7567C7', // lavender accent
          600: '#6052B3',
          700: '#4C4097',
        },
        ink: {
          950: '#0F1523',
          900: '#172033', // primary text
          700: '#3D4657',
          600: '#5F6878', // secondary text
          400: '#8A93A3', // muted text
          300: '#B0B7C3',
          200: '#E2E4EE', // subtle border
          100: '#F1F2FA', // soft section
          50:  '#F8F8FC', // primary background
        },
        surface: {
          bg: '#F8F8FC',
          card: '#FFFFFF',
          soft: '#F1F2FA',
          border: '#E2E4EE',
        },
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(23, 32, 51, 0.05), 0 1px 2px rgba(23, 32, 51, 0.03)',
        'card-hover': '0 6px 16px rgba(23, 32, 51, 0.08)',
        'subtle': '0 1px 2px rgba(23, 32, 51, 0.04)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
}
