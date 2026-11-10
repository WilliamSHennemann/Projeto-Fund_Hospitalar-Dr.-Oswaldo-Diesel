import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: { colors: { brand: { 50: '#FDECEE', 100: '#FAD3D7', 600: '#D02030', 700: '#A8121F', 800: '#7F101A' }, hospital: { 50: '#FDECEE', 600: '#D02030', 800: '#A8121F' }, accent: { 400: '#F5B800' }, ink: '#2A1E1E', warm: { 50: '#FAF7F6', 100: '#F3EEEC' } }, fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] }, boxShadow: { card: '0 8px 28px rgba(75, 30, 33, 0.08)', soft: '0 4px 14px rgba(75, 30, 33, 0.10)' } } },
  plugins: []
} satisfies Config
