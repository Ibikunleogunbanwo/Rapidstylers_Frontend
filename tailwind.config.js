/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'brand': '#9381FF', 
      },
      fontFamily: {
        serif: ['"Crimson Pro"', 'Georgia', 'serif'],
      },
      backgroundImage:{
        'stylerDoodle': "url('/src/assets/images/stylerDoodle.svg')",
        'saloonDoodle': "url('/src/assets/images/saloon_doodle.svg')"
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-6px)' },
          '40%': { transform: 'translateX(6px)' },
          '60%': { transform: 'translateX(-4px)' },
          '80%': { transform: 'translateX(4px)' },
        },
      },
      animation: {
        shake: 'shake 0.4s ease-in-out',
      },
    },
  },
  plugins: [],
}

// 6665dd