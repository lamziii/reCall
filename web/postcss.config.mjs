// Tailwind CSS v4 for Next.js runs as a PostCSS plugin (the Vite app used @tailwindcss/vite;
// this is the equivalent for the Next build pipeline). No tailwind.config — v4 is CSS-first,
// configured in src/styles/tokens/*.css exactly as in the Vite app.
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}

export default config
