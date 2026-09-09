/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        void: {
          DEFAULT: '#050507',
          deep: '#030304',
          surface: '#0A0A0E',
          card: '#101015',
          border: 'rgba(255, 255, 255, 0.08)',
          'border-bright': 'rgba(255, 255, 255, 0.18)',
        },
        signal: {
          DEFAULT: '#2563EB',
          bright: '#3B82F6',
          cyan: '#06B6D4',
          glow: 'rgba(37, 99, 235, 0.35)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.04em',
        widest: '0.2em',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'signal-glow': 'signalGlow 3s ease-in-out infinite alternate',
        'scanline': 'scanline 8s linear infinite',
      },
      keyframes: {
        signalGlow: {
          '0%': { opacity: '0.4', filter: 'drop-shadow(0 0 4px rgba(37, 99, 235, 0.3))' },
          '100%': { opacity: '1', filter: 'drop-shadow(0 0 16px rgba(37, 99, 235, 0.75))' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        },
      },
    },
  },
  plugins: [],
}
