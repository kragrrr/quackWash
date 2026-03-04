import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        display: ['"Press Start 2P"', "monospace"],
        body: ["VT323", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        pond: {
          DEFAULT: "hsl(var(--pond))",
          light: "hsl(var(--pond-light))",
          dark: "hsl(var(--pond-dark))",
        },
        duck: {
          idle: "hsl(var(--duck-idle))",
          running: "hsl(var(--duck-running))",
          maintenance: "hsl(var(--duck-maintenance))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "0px",
        md: "0px",
        sm: "0px",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "duck-bob": {
          "0%": { transform: "translateY(0px) rotate(-2deg)" },
          "25%": { transform: "translateY(-4px) rotate(-2deg)" },
          "50%": { transform: "translateY(-6px) rotate(2deg)" },
          "75%": { transform: "translateY(-4px) rotate(2deg)" },
          "100%": { transform: "translateY(0px) rotate(-2deg)" },
        },
        "duck-spin": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "duck-wobble": {
          "0%, 100%": { transform: "rotate(175deg)" },
          "25%": { transform: "rotate(180deg)" },
          "75%": { transform: "rotate(170deg)" },
        },
        "whirlpool-spin": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "pixel-march": {
          "0%, 49%": { borderColor: "hsl(var(--duck-running))" },
          "50%, 99%": { borderColor: "hsl(var(--duck-running) / 0.2)" },
        },
        "pixel-blink": {
          "0%, 49%": { opacity: "1" },
          "50%, 100%": { opacity: "0" },
        },
        "pixel-bob": {
          "0%": { transform: "translateY(0px)" },
          "33%": { transform: "translateY(-4px)" },
          "66%": { transform: "translateY(-6px)" },
          "100%": { transform: "translateY(0px)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        ripple: {
          "0%": { transform: "scale(0.8)", opacity: "1" },
          "100%": { transform: "scale(2)", opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "duck-bob": "duck-bob 2.4s steps(4, end) infinite",
        "duck-spin": "duck-spin 2s linear infinite",
        "duck-wobble": "duck-wobble 2.5s steps(4, end) infinite",
        "whirlpool-spin": "whirlpool-spin 4s linear infinite",
        "pixel-march": "pixel-march 1s steps(2, end) infinite",
        "pixel-blink": "pixel-blink 1s steps(2, end) infinite",
        "pixel-bob": "pixel-bob 1.6s steps(3, end) infinite",
        "fade-in-up": "fade-in-up 0.3s ease-out forwards",
        ripple: "ripple 2s ease-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
