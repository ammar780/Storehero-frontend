/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:'#fefbec',100:'#fdf3c9',200:'#fbe793',300:'#f8d85d',
          400:'#f1c349',500:'#e0a820',600:'#c48516',700:'#9e5f16',
          800:'#81491a',900:'#6b3c1a',950:'#3e1f0b'
        },
        surface: {
          50:'#fafafa',100:'#f4f4f5',200:'#e4e4e7',300:'#d4d4d8',
          400:'#a1a1aa',500:'#71717a',600:'#52525b',700:'#3f3f46',
          800:'#27272a',900:'#18181b',950:'#09090b'
        },
        profit: { up: '#16a34a', down: '#dc2626', neutral: '#71717a' },
      },
      fontFamily: { display: ['"Outfit"', 'sans-serif'], body: ['"DM Sans"', 'sans-serif'] },
      boxShadow: {
        glow: '0 0 20px rgba(241,195,73,0.25)',
        card: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
        cardHover: '0 10px 40px rgba(0,0,0,0.08)',
        modal: '0 25px 50px rgba(0,0,0,0.15)',
      },
      borderRadius: { '2xl': '1rem', '3xl': '1.5rem' },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.5s ease-out forwards',
        'slide-right': 'slideRight 0.3s ease-out forwards',
        'scale-in': 'scaleIn 0.3s ease-out forwards',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideRight: { from: { opacity: '0', transform: 'translateX(-8px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        scaleIn: { from: { opacity: '0', transform: 'scale(0.95)' }, to: { opacity: '1', transform: 'scale(1)' } },
        pulseSoft: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.7' } },
        shimmer: { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(100%)' } },
      }
    }
  },
  darkMode: 'class',
  plugins: []
}
