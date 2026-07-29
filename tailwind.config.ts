import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // CEVA brand on a light theme: CEVA blue #0033A0, deep navy #001F5C.
        ink: "#eef1f7", // inset surface (code/preview blocks)
        panel: "#f5f7fb", // card surface
        edge: "#dfe4ee", // light borders
        muted: "#5c6576", // secondary text, readable on white
        strong: "#0d1526", // emphasis text
        accent: "#0033A0", // CEVA blue
        accentDark: "#001F5C",
        good: "#1f8a5f",
        warn: "#b8770a",
        bad: "#dc2626",
      },
    },
  },
  plugins: [],
};
export default config;
