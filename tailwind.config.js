/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        pitch: '#0E3B2E',
        pitchdeep: '#092A21',
        chalk: '#F2EDE3',
        gold: '#E8B23A',
        clay: '#D4573B',
        sage: '#7FB6A4'
      },
      fontFamily: {
        display: ['Graduate', 'serif'],
        body: ['Outfit', 'sans-serif']
      }
    }
  },
  plugins: []
};
