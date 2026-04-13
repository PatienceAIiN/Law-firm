/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "system-ui", "sans-serif"],
        display: ["Outfit", "system-ui", "sans-serif"],
      },
      colors: {
        ink: { 950: "#0b1220", 900: "#111827", 700: "#374151" },
        mist: { 100: "#f3f4f6", 200: "#e5e7eb" },
        accent: { DEFAULT: "#2563eb", soft: "#dbeafe" },
      },
    },
  },
  plugins: [],
};
