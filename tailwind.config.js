/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,vue}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        warm: {
          50: '#FFF8F0',
          100: '#FFF0DB',
          200: '#FFE0B2',
          300: '#FFCC80',
          400: '#FFB347',
          500: '#E8652B',
          600: '#D4531A',
          700: '#B04010',
          800: '#8C300D',
          900: '#3D2C2C',
        },
        sage: {
          100: '#E8F5E9',
          200: '#C8E6C9',
          300: '#A5D6A7',
          400: '#7BAE7F',
          500: '#5C9460',
        },
        group: {
          family: '#E8652B',
          neighbor: '#7BAE7F',
          community: '#5B9BD5',
          hospital: '#D94F4F',
          repair: '#E8A838',
          pharmacy: '#9B6DB7',
        }
      },
      fontFamily: {
        serif: ['Noto Serif SC', 'serif'],
        sans: ['Noto Sans SC', 'sans-serif'],
      },
      fontSize: {
        'card-sm': ['14px', { lineHeight: '1.5' }],
        'card-md': ['18px', { lineHeight: '1.6' }],
        'card-lg': ['24px', { lineHeight: '1.7' }],
        'card-xl': ['32px', { lineHeight: '1.8' }],
        'card-2xl': ['40px', { lineHeight: '1.8' }],
      },
    },
  },
  plugins: [],
};
