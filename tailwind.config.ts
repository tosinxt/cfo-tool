import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-ppmondwest)"],
        body: ["var(--font-af)"],
      },
      colors: {
        // GIC brand palette
        "hudson-blue": "var(--color-hudson-blue)",
        "slate-cyan": "var(--color-slate-cyan)",
        "graphite-night": "var(--color-graphite-night)",
        ink: "var(--color-ink)",
        carbon: "var(--color-carbon)",
        iron: "var(--color-iron)",
        steel: "var(--color-steel)",
        fog: "var(--color-fog)",
        ash: "var(--color-ash)",
        mist: "var(--color-mist)",
        sage: "var(--color-sage)",
        cream: "var(--color-cream)",
        linen: "var(--color-linen)",
        paper: "var(--color-paper)",
        obsidian: "var(--color-obsidian)",
        // shadcn system tokens
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        pill: "50px",
        hero: "24px",
        elevated: "16px",
        card: "12px",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        subtle: "var(--shadow-subtle)",
        "subtle-2": "var(--shadow-subtle-2)",
        "subtle-3": "var(--shadow-subtle-3)",
        "sm-2": "var(--shadow-sm-2)",
      },
    },
  },
  plugins: [],
};
export default config;
