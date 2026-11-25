import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: { colors: { brand: { 50: '#FFF1F2', 100: '#FFE2E5', 200: '#FFC5CC', 300: '#F5A0AA', 600: '#D02030', 700: '#A8121F', 800: '#7F101A' }, hospital: { 50: '#FDECEE', 600: '#D02030', 800: '#A8121F' }, accent: { 300: '#EAF2A3', 400: '#DBE753', 500: '#CDDD3C', 600: '#87951C' }, support: { 50: '#EFF7FF', 100: '#D9ECFA', 600: '#438BCB', 800: '#1E527F' }, ink: '#243247', warm: { 50: '#F7F8F9', 100: '#E9EDF0' } }, fontFamily: { sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] }, boxShadow: { card: '0 12px 32px rgba(27, 43, 60, 0.08)', soft: '0 5px 16px rgba(27, 43, 60, 0.12)' } } },
  plugins: []
} satisfies Config
