/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./components/**/*.{js,jsx,ts,tsx}", "./app/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {
        fustat: "Fustat_400Regular",
        bungee: "Bungee_400Regular",
        fredokaone: "FredokaOne_400Regular",
      },
    },
  },
  plugins: [
    function ({ addBase }) {
      addBase({
        'text': {
          '@apply font-bungee': {},
        },
      });
    },
  ],
}