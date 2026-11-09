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
        charcoal: {
          950: '#070C0E',
          900: '#0B1317',
          800: '#121E24',
          700: '#172B3A',
          600: '#1E3648',
        },
        concrete: {
          DEFAULT: '#2A3F4D',
          dark: '#1E2D36',
          light: '#3D4F5C',
          muted: '#8A99A4',
          paper: '#E3E7E9',
        },
        safety: {
          DEFAULT: '#E05A34',
          hover: '#C84D29',
          light: '#FCECE8',
          border: '#F8BBAA',
        },
        blueprint: {
          DEFAULT: '#26A69A',
          cyan: '#38BDF8',
          line: 'rgba(56, 189, 248, 0.4)',
          glow: 'rgba(38, 166, 154, 0.25)',
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
        mono: ['"JetBrains Mono"', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(23, 43, 58, 0.05), 0 1px 2px 0 rgba(23, 43, 58, 0.03)',
        'elevated': '0 4px 6px -1px rgba(23, 43, 58, 0.07), 0 2px 4px -1px rgba(23, 43, 58, 0.04)',
      },
    },
  },
  plugins: [],
}
