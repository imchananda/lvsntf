/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        levis: {
          red: '#E00034',
          darkred: '#B40F28',
          indigo: '#122D55',
          dark: '#0B192C',
          denim: '#1E3E62',
          chambray: '#8DA4C4',
          ice: '#E8EFF7',
          canvas: '#FAFAFC',
          gold: '#E5A93C',
          leather: '#D2A679',
        },
        prada: {
          offwhite: 'rgb(var(--prada-offwhite) / <alpha-value>)',
          cream: 'rgb(var(--prada-cream) / <alpha-value>)',
          parchment: 'rgb(var(--prada-parchment) / <alpha-value>)',
          stone: 'rgb(var(--prada-stone) / <alpha-value>)',
          warm: 'rgb(var(--prada-warm) / <alpha-value>)',
          taupe: 'rgb(var(--prada-taupe) / <alpha-value>)',
          charcoal: 'rgb(var(--prada-charcoal) / <alpha-value>)',
          black: 'rgb(var(--prada-black) / <alpha-value>)',
          gold: 'rgb(var(--prada-gold) / <alpha-value>)',
          darkgold: 'rgb(var(--prada-darkgold) / <alpha-value>)',
          'red-light': 'rgb(var(--prada-red-light) / <alpha-value>)',
          red: 'rgb(var(--prada-red) / <alpha-value>)',
        }
      },
      fontFamily: {
        google: ['"Google Sans"', '"Noto Sans Thai"', 'sans-serif'],
        display: ['"Poiret One"', '"Noto Sans Thai"', 'serif'],
        body: ['"Noto Sans Thai"', 'Inter', 'sans-serif'],
        sans: ['"Noto Sans Thai"', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
