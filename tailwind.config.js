import { fontFamily } from 'tailwindcss/defaultTheme';

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx,jsx,js}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', ...fontFamily.sans],
      },
      colors: {
        background: '#181A1B',
        foreground: '#F3F4F8',
        muted: {
          DEFAULT: '#232426',
          foreground: '#A0A4B8'
        },
        card: {
          DEFAULT: '#232426cc',
          foreground: '#F3F4F8'
        },
        accent: {
          DEFAULT: '#232426b3',
          foreground: '#F3F4F8'
        },
        primary: {
          DEFAULT: '#222326',
          foreground: '#fff'
        },
        secondary: {
          DEFAULT: '#232426',
          foreground: '#F3F4F8'
        },
        danger: {
          DEFAULT: '#FF5F5F',
          foreground: '#fff'
        },
        success: {
          DEFAULT: '#46d98d',
          foreground: '#052e16'
        },
        glass: 'rgba(36, 37, 38, 0.7)',
        border: '#232426',
        highlight: '#F3F4F8',
        low: '#A0A4B8',
        medium: '#44474a',
        high: '#FF5F5F',
      },
      boxShadow: {
        'soft': '0 4px 24px 0 rgba(36,37,38,0.18), 0 1.5px 4px 0 rgba(36,37,38,0.08)',
        'glow': '0 0 0 2px #F3F4F833, 0 8px 32px -8px #F3F4F844',
        'glass': '0 8px 32px 0 rgba(36, 37, 38, 0.18)',
      },
      borderRadius: {
        'xl': '1.25rem',
        '2xl': '2rem',
        'full': '9999px',
      },
      backdropBlur: {
        xs: '2px'
      },
      animation: {
        'fade-in': 'fadeIn 300ms ease-out',
        'slide-up-fade': 'slideUpFade 400ms cubic-bezier(.21,.68,.18,1)',
        'spin-slow': 'spin 8s linear infinite',
        'pop': 'pop 220ms cubic-bezier(.21,.68,.18,1)',
        'wiggle': 'wiggle 0.7s ease-in-out infinite',
        'bounce-in': 'bounceIn 400ms cubic-bezier(.34,1.56,.64,1)',
        first: "moveVertical 30s ease infinite",
        second: "moveInCircle 20s reverse infinite",
        third: "moveInCircle 40s linear infinite",
        fourth: "moveHorizontal 40s ease infinite",
  fifth: "moveInCircle 20s ease infinite",
  'shine': 'shine 2.2s linear infinite',
  'glow-pulse': 'glowPulse 3.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 }
        },
        slideUpFade: {
          '0%': { opacity: 0, transform: 'translateY(16px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' }
        },
        pop: {
          '0%': { transform: 'scale(0.92)' },
          '80%': { transform: 'scale(1.04)' },
          '100%': { transform: 'scale(1)' }
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-2deg)' },
          '50%': { transform: 'rotate(2deg)' }
        },
        bounceIn: {
          '0%': { transform: 'scale(0.7)', opacity: 0 },
          '60%': { transform: 'scale(1.1)', opacity: 1 },
          '100%': { transform: 'scale(1)', opacity: 1 }
        },
        moveHorizontal: {
          "0%": {
            transform: "translateX(-50%) translateY(-10%)",
          },
          "50%": {
            transform: "translateX(50%) translateY(10%)",
          },
          "100%": {
            transform: "translateX(-50%) translateY(-10%)",
          },
        },
        moveInCircle: {
          "0%": {
            transform: "rotate(0deg)",
          },
          "50%": {
            transform: "rotate(180deg)",
          },
          "100%": {
            transform: "rotate(360deg)",
          },
        },
        moveVertical: {
          "0%": {
            transform: "translateY(-50%)",
          },
          "50%": {
            transform: "translateY(50%)",
          },
          "100%": {
            transform: "translateY(-50%)",
          },
        },
        shine: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' }
        },
        glowPulse: {
          '0%,100%': { boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 4px 14px -4px rgba(255,255,255,0.12)' },
          '50%': { boxShadow: '0 0 0 1px rgba(255,255,255,0.12), 0 4px 18px -2px rgba(255,255,255,0.20)' }
        }
      }
    }
  },
  plugins: []
};
