import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        brand: {
          DEFAULT: "rgba(var(--brand-rgb), <alpha-value>)",
          hover: "rgba(var(--brand-hover-rgb), <alpha-value>)",
          dark: "rgba(var(--brand-dark-rgb), <alpha-value>)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        navy: { 
          600: '#1e3a8a', 
          700: '#172554', 
          800: '#0f172a' 
        },
        amber: {
          450: '#f8af18',
          455: '#f8ad16',
          550: '#e78b09',
          650: '#c76508',
          955: '#401702',
        },
        blue: {
          650: '#2159e2',
        },
        cyan: {
          650: '#0b83a1',
        },
        emerald: {
          55: '#e9fdf3',
          450: '#22c68d',
          650: '#058760',
          655: '#04865f',
          955: '#02291f',
        },
        indigo: {
          450: '#7279f5',
          455: '#7177f4',
          650: '#493fd8',
          655: '#483ed6',
        },
        pink: {
          450: '#f05da8',
          650: '#cd206a',
        },
        rose: {
          90: '#ffe7e8',
          350: '#fc8b9a',
          450: '#f85872',
          455: '#f75670',
          650: '#d01842',
          655: '#ce1741',
          955: '#460416',
        },
        slate: {
          55: '#f7fafc',
          105: '#f0f4f9',
          150: '#eaeff5',
          205: '#e1e7ef',
          250: '#d7dfe9',
          305: '#c8d3df',
          330: '#bbc6d5',
          350: '#b0bccd',
          355: '#adbaca',
          405: '#92a1b6',
          450: '#7c8ca2',
          455: '#7a899f',
          550: '#56657a',
          555: '#546378',
          650: '#3d4b5f',
          655: '#3c4a5e',
          750: '#293548',
          805: '#1d283a',
          850: '#172033',
          855: '#161f32',
          955: '#010415',
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      spacing: {
        // Half-step sizes used across the app (e.g. h-4.5/w-4.5 for 18px icons, py-5.5)
        '4.5': '1.125rem',
        '5.5': '1.375rem',
      },
      scale: {
        '130': '1.3',
      },
      keyframes: {
        'fade-up': { 
          '0%': { opacity: '0', transform: 'translateY(16px)' }, 
          '100%': { opacity: '1', transform: 'translateY(0)' } 
        },
        shimmer: { 
          '0%': { backgroundPosition: '0% 50%' }, 
          '100%': { backgroundPosition: '200% 50%' } 
        },
        'slide-in': {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'toast-progress': {
          '0%': { transform: 'scaleX(1)' },
          '100%': { transform: 'scaleX(0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.5s ease-out forwards',
        shimmer: 'shimmer 2s infinite linear',
        'slide-in': 'slide-in 0.3s ease-out forwards',
        'scale-in': 'scale-in 0.2s ease-out forwards',
        'fade-in': 'fade-in 0.3s ease-out both',
        'toast-progress': 'toast-progress 3.2s linear forwards',
      },
    },
  },
  plugins: [],
};
export default config;
