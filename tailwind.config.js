/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./features/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#fc6b2b",
        status: {
          pending: "#f59e0b",
          enroute: "#3b82f6",
          completed: "#22c55e",
          error: "#ef4444",
        },
      },
    },
  },
  plugins: [],
};
