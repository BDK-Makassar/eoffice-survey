import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef5ff",
          100: "#d9e9ff",
          200: "#b3d3ff",
          300: "#80b6ff",
          400: "#4d94ff",
          500: "#2472f2",
          600: "#1657c9",
          700: "#12459c",
          800: "#123a7c",
          900: "#0f2f5e",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "Segoe UI", "Roboto", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
