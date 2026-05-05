import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "rgb(var(--bg) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-2": "rgb(var(--surface-2) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        "border-strong": "rgb(var(--border-strong) / <alpha-value>)",
        fg: "rgb(var(--fg) / <alpha-value>)",
        "fg-muted": "rgb(var(--fg-muted) / <alpha-value>)",
        "fg-subtle": "rgb(var(--fg-subtle) / <alpha-value>)",
        accent: "rgb(var(--accent) / <alpha-value>)",
        "accent-fg": "rgb(var(--accent-fg) / <alpha-value>)",
        // catalyst category colours
        "cat-earn": "rgb(var(--cat-earn) / <alpha-value>)",
        "cat-div": "rgb(var(--cat-div) / <alpha-value>)",
        "cat-fda": "rgb(var(--cat-fda) / <alpha-value>)",
        "cat-prod": "rgb(var(--cat-prod) / <alpha-value>)",
        "cat-opt": "rgb(var(--cat-opt) / <alpha-value>)",
        "cat-idx": "rgb(var(--cat-idx) / <alpha-value>)",
        "cat-lock": "rgb(var(--cat-lock) / <alpha-value>)",
        "cat-anal": "rgb(var(--cat-anal) / <alpha-value>)",
        // phase
        "phase-quiet": "rgb(var(--phase-quiet) / <alpha-value>)",
        "phase-mod": "rgb(var(--phase-mod) / <alpha-value>)",
        "phase-heavy": "rgb(var(--phase-heavy) / <alpha-value>)",
      },
      fontFamily: {
        sans: ['"Geist Sans"', "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ['"Geist Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        card: "0 1px 0 0 rgb(var(--border) / 1)",
        ring: "0 0 0 4px rgb(var(--accent) / 0.18)",
      },
    },
  },
  plugins: [],
};

export default config;
