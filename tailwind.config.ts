import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "rgb(251 250 248 / <alpha-value>)",
        foreground: "rgb(23 19 20 / <alpha-value>)",
        wine: "rgb(127 23 52 / <alpha-value>)",
        "wine-dark": "rgb(74 11 30 / <alpha-value>)"
      }
    }
  },
  plugins: []
};

export default config;
