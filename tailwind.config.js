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
      }
    },
  },
  plugins: [],
}

// 6665dd