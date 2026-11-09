/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#F5F6F4',
        surface: {
          DEFAULT: '#FFFFFF',
          subtle: '#FAFBF9',
          muted: '#F0F2F0',
        },
        border: {
          DEFAULT: '#E3E7E9',
          dark: '#CFD6D9',
        },
        primary: {
          DEFAULT: '#183B45',
          hover: '#122D35',
          light: '#EAF0F1',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#357B75',
          hover: '#2A635E',
          light: '#EDF6F5',
          foreground: '#FFFFFF',
        },
        text: {
          primary: '#172B3A',
          secondary: '#697783',
          muted: '#8F9CA7',
          inverted: '#FFFFFF',
        },
        status: {
          success: {
            DEFAULT: '#2E7D32',
            bg: '#EDF7ED',
            border: '#C8E6C9',
          },
          warning: {
            DEFAULT: '#D97706',
            bg: '#FFFBEB',
            border: '#FDE68A',
          },
          danger: {
            DEFAULT: '#C53030',
            bg: '#FDF2F2',
            border: '#FECACA',
          },
          info: {
            DEFAULT: '#1D4ED8',
            bg: '#EFF6FF',
            border: '#BFDBFE',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(23, 43, 58, 0.05), 0 1px 2px 0 rgba(23, 43, 58, 0.03)',
        'elevated': '0 4px 6px -1px rgba(23, 43, 58, 0.07), 0 2px 4px -1px rgba(23, 43, 58, 0.04)',
      },
    },
  },
  plugins: [],
}
