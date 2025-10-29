/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#000000', // Preto
          50: '#f5f5f5',
          100: '#e5e5e5',
          200: '#cccccc',
          300: '#b3b3b3',
          400: '#999999',
          500: '#808080',
          600: '#666666',
          700: '#4d4d4d',
          800: '#333333',
          900: '#1a1a1a',
          950: '#000000',
        },
        purple: {
          DEFAULT: 'rgb(165, 44, 240)', // #a52cf0
          light: 'rgb(185, 84, 245)',
          dark: 'rgb(145, 24, 220)',
        },
        lime: {
          DEFAULT: 'rgb(220, 253, 97)', // #dcfd61
          light: 'rgb(230, 254, 127)',
          dark: 'rgb(210, 243, 67)',
        },
      },
    },
  },
  plugins: [],
}
