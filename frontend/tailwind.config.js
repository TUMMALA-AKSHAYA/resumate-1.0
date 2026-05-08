/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        /** Readable body / heading text (navy–charcoal scale) */
        ink: {
          DEFAULT: '#0f172a',
          secondary: '#1e293b',
          tertiary: '#334155',
          muted: '#475569',
          subtle: '#64748b',
        },
        /** Surfaces & chrome */
        surface: {
          DEFAULT: '#ffffff',
          subtle: '#f8fafc',
          tint: '#eff6ff',
          line: '#e2e8f0',
          strong: '#cbd5e1',
        },
        /** Primary brand blues */
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      boxShadow: {
        card: '0 1px 3px rgba(37, 99, 235, 0.08), 0 1px 2px rgba(15, 23, 42, 0.04)',
        soft: '0 10px 40px -12px rgba(37, 99, 235, 0.15)',
      },
    },
  },
  plugins: [],
};
