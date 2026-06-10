/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // base luminosa
        bg: '#F4F5F7',
        surface: '#ffffff',
        surface2: '#F7F8FA',
        line: '#ECEDF0',
        line2: '#F0F1F4',
        line3: '#F2F3F5',

        // tinta
        ink: '#0E1116',
        ink2: '#1f2329',
        muted: '#5b6470',
        dim: '#7f8794',
        dim2: '#9aa1ac',
        dim3: '#b6bcc5',
        dim4: '#c4c9d0',

        // héroe oscuro
        night: '#0d1017',
        night2: '#14182a',
        nightLine: 'rgba(255,255,255,0.08)',
        nightInk: '#cdd2da',
        nightMuted: '#7f8794',

        // acentos
        pitch: '#22c372',
        pitchInk: '#06231a',
        pitchHover: '#27d27c',
        pitchSoft: '#DDF3E7',
        pitchSoftInk: '#06914B',
        pitchExact: '#9be8c0',
        pitchHi: '#F3FBF6',
        live: '#FF5A5F',
        liveSoft: '#FFE3E4',
        liveInk: '#b0454a',
        gold: '#E0A400',
        gold2: '#F4B400',
        gold3: '#FFD54A',
        goldSoft: '#FFE7A8'
      },
      fontFamily: {
        sans: ['Manrope', 'system-ui', 'sans-serif'],
        display: ['Archivo', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        card: '0 10px 30px rgba(15,18,25,.05)',
        cardSm: '0 8px 22px rgba(15,18,25,.05)',
        cardXs: '0 6px 18px rgba(15,18,25,.045)',
        cardLg: '0 14px 30px rgba(13,16,23,.16)',
        cta: '0 10px 24px rgba(34,195,114,.3)',
        ctaLg: '0 12px 26px rgba(34,195,114,.32)',
        flag: '0 2px 6px rgba(0,0,0,.12)',
        flagLg: '0 6px 16px rgba(0,0,0,.4)'
      }
    }
  },
  plugins: []
};
