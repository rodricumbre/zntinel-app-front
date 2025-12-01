/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
    extend: {
      colors: {
        zntinel: {
          bg: "#020617",
          card: "#020617",
          primary: "#22d3ee",
          accent: "#a855f7",
        },
      },
    },
  },
  plugins: [],
};

