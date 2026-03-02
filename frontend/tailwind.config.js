const animatePlugin = require('tailwindcss-animate');

/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      container: {
        center: true,
        padding: '1.5rem',
        screens: {
          '2xl': '1400px'
        }
      },
      colors: {
        // Boutique Dental Palette (Black & Gold)
        obsidian: {
          DEFAULT: '#1A1A1A', // Primary Base
          light: '#2A2A2A',
          dark: '#0F0F0F',
        },
        gold: {
          metallic: '#D4AF37', // Primary Accent
          champagne: '#C5A059', // Action Color
          soft: '#F1E5AC',     // Patient Buttons
          50: '#FFFDF5',
          100: '#FFF9E6',
          200: '#FFF2CC',
          300: '#FFE8A3',
          400: '#FFD966',
          500: '#D4AF37',
          600: '#B8941F',
          700: '#9C7A0A',
          800: '#7D6008',
          900: '#5D4706',
        },
        black: {
          50: '#F5F5F5',
          100: '#E0E0E0',
          200: '#CCCCCC',
          300: '#B3B3B3',
          400: '#999999',
          500: '#808080',
          600: '#666666',
          700: '#4D4D4D',
          800: '#333333',
          900: '#1A1A1A', // Obsidian base
          950: '#0F0F0F', // Obsidian dark
        },
        success: {
          DEFAULT: '#2D6A4F',
          foreground: '#FFFFFF'
        },
        alert: {
          DEFAULT: '#EF8354',
          foreground: '#FFFFFF'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: '#D4AF37', // Gold
          foreground: '#1A1A1A'
        },
        secondary: {
          DEFAULT: '#1A1A1A', // Obsidian
          foreground: '#D4AF37'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: '#D4AF37', // Gold metallic
          foreground: '#1A1A1A'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#1A1A1A'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 }
        },
        'snowfall': {
          '0%': { transform: 'translateY(-10vh) translateX(0)', opacity: '1' },
          '100%': { transform: 'translateY(110vh) translateX(20vw)', opacity: '0' },
        },
        'float-up': {
          '0%': { transform: 'translateY(10vh) scale(0.8)', opacity: '0' },
          '20%': { opacity: '0.8' },
          '80%': { opacity: '0.8' },
          '100%': { transform: 'translateY(-110vh) scale(1)', opacity: '0' },
        },
        'firework-burst': {
          '0%': { transform: 'scale(0)' },
          '50%': { transform: 'scale(1)' },
          '100%': { transform: 'scale(1)', opacity: '0' },
        },
        'firework-particle': {
          '0%': { transform: 'rotate(var(--r)) translateY(0) scale(1)', opacity: '1' },
          '100%': { transform: 'rotate(var(--r)) translateY(-80px) scale(0)', opacity: '0' },
        },
        'float-heart': {
          '0%': { transform: 'translateY(10vh) scale(0.5) rotate(-10deg)', opacity: '0' },
          '20%': { opacity: '0.8', transform: 'translateY(-10vh) scale(1) rotate(10deg)' },
          '80%': { opacity: '0.8', transform: 'translateY(-70vh) scale(1) rotate(-10deg)' },
          '100%': { transform: 'translateY(-110vh) scale(0.5) rotate(10deg)', opacity: '0' },
        },
        'float-ghost': {
          '0%': { transform: 'translateY(10vh) translateX(0) scale(0.8)', opacity: '0' },
          '20%': { opacity: '0.7', transform: 'translateY(-10vh) translateX(10vw) scale(1)' },
          '80%': { opacity: '0.7', transform: 'translateY(-70vh) translateX(-10vw) scale(1)' },
          '100%': { transform: 'translateY(-110vh) translateX(0) scale(0.8)', opacity: '0' },
        }
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'snowfall': 'snowfall linear infinite',
        'float-up': 'float-up linear infinite',
        'firework-burst': 'firework-burst 2s ease-out infinite',
        'firework-particle': 'firework-particle 2s ease-out infinite',
        'float-heart': 'float-heart linear infinite',
        'float-ghost': 'float-ghost linear infinite'
      }
    }
  },
  plugins: [animatePlugin]
};

module.exports = config;
