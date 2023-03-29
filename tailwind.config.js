/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        mytext: "#10A37F",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
