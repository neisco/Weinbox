import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        wine: "rgb(127 23 52 / <alpha-value>)",
        "wine-dark": "var(--wine-dark)"
      }
    }
  },
  plugins: []
};

export default config;
