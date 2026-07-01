/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@relume_io/relume-ui/dist/**/*.{js,ts,jsx,tsx}",
  ],
  presets: [require("@relume_io/relume-tailwind")],
  theme: {
    extend: {
      colors: {
        background: "#F5F0EA",
        surface: "#EDE6D6",
        primary: "#2C1F14",
        "primary-light": "#3D2B1C",
        accent: "#C4714A",
        "accent-light": "#D4845E",
        nature: "#7A8C6E",
        cream: "#FEFCF8",
      },
      fontFamily: {
        heading: ["Playfair Display", "Georgia", "serif"],
        body: ["DM Sans", "Inter", "sans-serif"],
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(28px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-up": "fadeUp 0.8s ease forwards",
        "fade-in": "fadeIn 0.6s ease forwards",
        "scale-in": "scaleIn 0.5s ease forwards",
      },
      boxShadow: {
        warm: "0 4px 32px -4px rgba(44, 31, 20, 0.18)",
        "warm-lg": "0 12px 60px -8px rgba(44, 31, 20, 0.25)",
      },
    },
  },
};
