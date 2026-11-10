/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Luxury Architectural Palette
        forest: {
          DEFAULT: '#151D19', // Deep forest charcoal
          dark: '#0E1411',
          surface: '#1A241F',
        },
        industrial: {
          DEFAULT: '#28362E', // Industrial green
          dark: '#1F2A24',
          light: '#33443B',
        },
        olive: {
          DEFAULT: '#68745B', // Weathered olive
          dark: '#545E4A',
          light: '#7F8E6F',
        },
        copper: {
          DEFAULT: '#BD6847', // Oxidised copper
          hover: '#A85637',
          light: '#D47D5C',
          muted: '#8E4B33',
        },
        limestone: {
          DEFAULT: '#C9B99E', // Natural limestone
          dark: '#B5A384',
          light: '#DCD0BB',
          subtle: '#E8E0D1',
        },
        parchment: {
          DEFAULT: '#E5DCCB', // Warm parchment
          light: '#F4EFE6',
          muted: '#D0C4AF',
        },

        // System Base Tokens
        background: '#151D19',
        surface: {
          DEFAULT: '#28362E',
          subtle: '#1F2A24',
          muted: '#151D19',
        },
        border: {
          DEFAULT: '#68745B',
          dark: '#33443B',
          light: '#C9B99E',
        },
        primary: {
          DEFAULT: '#28362E',
          hover: '#1F2A24',
          light: '#68745B',
          foreground: '#E5DCCB',
        },
        secondary: {
          DEFAULT: '#BD6847',
          hover: '#A85637',
          light: '#C9B99E',
          foreground: '#151D19',
        },
        text: {
          primary: '#E5DCCB',
          secondary: '#C9B99E',
          muted: '#68745B',
          dark: '#151D19',
        },

        // Status & Governance Indicators in Architectural Palette
        status: {
          success: {
            DEFAULT: '#C9B99E',
            bg: '#1F2A24',
            border: '#68745B',
          },
          warning: {
            DEFAULT: '#BD6847',
            bg: '#2A1F18',
            border: '#8E4B33',
          },
          danger: {
            DEFAULT: '#D47D5C',
            bg: '#2D1815',
            border: '#BD6847',
          },
          info: {
            DEFAULT: '#E5DCCB',
            bg: '#28362E',
            border: '#68745B',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(21, 29, 25, 0.3), 0 1px 2px 0 rgba(21, 29, 25, 0.2)',
        'elevated': '0 4px 12px -2px rgba(21, 29, 25, 0.5), 0 2px 6px -1px rgba(21, 29, 25, 0.3)',
        'copper': '0 0 20px -3px rgba(189, 104, 71, 0.35)',
      },
    },
  },
  plugins: [],
}
