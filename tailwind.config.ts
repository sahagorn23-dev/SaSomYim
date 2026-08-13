/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        kanit: ["var(--font-kanit)", "sans-serif"],
        ibm: ["var(--font-ibm)", "sans-serif"],
      },
      colors: {
        cream: "#F3ECE7",
        card: "#FDFBF9",
        espresso: "#4A2E1E",
        peach: "#F2A66B",
        "chip-peach": "#F7D9C4",
        "chip-mint": "#DCE8C8",
        "chip-lavender": "#F3D9EA",
        ink: "#2B2420",
        muted: "#8A7F76",
        "line-green": "#06C755",
      },
    },
  },
  plugins: [],
};

