import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: { colors: { hospital: { 50: '#fff9e6', 600: '#d99a00', 800: '#8a5b00' } } } },
  plugins: []
} satisfies Config
