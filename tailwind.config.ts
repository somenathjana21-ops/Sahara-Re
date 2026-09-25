import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#206140",
          container: "#3b7a57",
          light: "#e8f3ec",
          dark: "#15422b",
        },
        secondary: {
          DEFAULT: "#475569",
          container: "#e2e8f0",
          light: "#f1f5f9",
        },
        surface: {
          DEFAULT: "#f8fafc",
          dim: "#f1f5f9",
          card: "#ffffff",
          elevated: "#ffffff",
        },
        tertiary: {
          DEFAULT: "#8e3d22",
          rose: "#d97757",
          light: "#fef2ee",
        },
        outline: {
          DEFAULT: "#cbd5e1",
          subtle: "#e2e8f0",
        },
        distress: {
          green: "#15803d",
          amber: "#d97706",
          red: "#dc2626",
          critical: "#991b1b",
        }
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        md: "0.75rem",
        lg: "1rem",
        xl: "1.5rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
      }
    },
  },
  plugins: [],
};

export default config;
