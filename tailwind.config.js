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
      backgroundImage:{
        'stylerDoodle': "url('/src/assets/images/stylerDoodle.svg')"
      }
    },
  },
  plugins: [],
}

// 6665dd