import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: { extend: { colors: { hospital: { 50: '#effaf8', 600: '#047c75', 800: '#155e59' } } } },
  plugins: []
} satisfies Config
