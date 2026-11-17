import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Hijau Kemenag + emas, selaras dengan website bdkmakassar.id
        brand: {
          50: "#eef6f2",
          100: "#d5eadf",
          200: "#acd4c0",
          300: "#7cb89c",
          400: "#4a9a79",
          500: "#24805f",
          600: "#0e6b55",
          700: "#0b5847",
          800: "#0b4f40",
          900: "#0a3a30",
        },
        emas: { 300: "#f0cf7a", 400: "#e8c15a", 500: "#e2b13c", 600: "#c4952a" },
        ink: "#16302a",
      },
      fontFamily: {
        sans: ["var(--font-jakarta)", "ui-sans-serif", "system-ui", "Segoe UI", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
