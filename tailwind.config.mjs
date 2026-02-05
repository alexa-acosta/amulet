/** @type {import('tailwindcss').Config} */

export default {
  content: ["./src/app/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "wild-berry": "#330511",
        "cool-mist": "#BDC5CF",
        "ivory-cream": "#F8F8EC",
        "powder-grey": "#DFE3EA",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-100%)" },
        },
      },
      animation: {
        marquee: "marquee 25s linear infinite",
      },
    },
  },
  plugins: [],
};
