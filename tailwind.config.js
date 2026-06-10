/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0a',
        surface: '#141414',
        surface2: '#1c1c1c',
        line: '#262626',
        ink: '#fafafa',
        muted: '#a3a3a3',
        dim: '#737373',
        yellow: '#ffdd00',
        yellowdim: '#d9bb00',
        live: '#ff3b30',
        ok: '#1ea84c'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace']
      }
    }
  },
  plugins: []
};
