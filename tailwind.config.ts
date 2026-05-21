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
        display: ['Orbitron', 'Noto Sans SC', 'sans-serif'],
        body: ['Inter', 'Noto Sans SC', 'sans-serif'],
        cn: ['"Noto Sans SC"', 'sans-serif'],
        mono: ['Share Tech Mono', 'monospace'],
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
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        neon: {
          purple: "hsl(var(--neon-purple))",
          cyan: "hsl(var(--neon-cyan))",
          magenta: "hsl(var(--neon-magenta))",
          yellow: "hsl(var(--neon-yellow))",
          green: "hsl(var(--neon-green))",
          red: "hsl(var(--neon-red))",
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
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "pulse-glow": {
          "0%, 100%": { opacity: "1", filter: "brightness(1)" },
          "50%": { opacity: "0.85", filter: "brightness(1.35)" },
        },
        "scan": { "0%": { transform: "translateY(-100%)" }, "100%": { transform: "translateY(100%)" } },
        "scan-x": { "0%": { transform: "translateX(-100%)" }, "100%": { transform: "translateX(100%)" } },
        "flicker": {
          "0%, 100%": { opacity: "1" },
          "41.99%": { opacity: "1" },
          "42%": { opacity: "0.3" },
          "43%": { opacity: "1" },
          "47.99%": { opacity: "1" },
          "48%": { opacity: "0.5" },
          "49%": { opacity: "1" },
        },
        "slide-up": { "0%": { transform: "translateY(20px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        "fade-in": { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        "card-deal": {
          "0%": { transform: "translateY(-40px) rotate(-12deg) scale(0.6)", opacity: "0" },
          "60%": { opacity: "1" },
          "100%": { transform: "translateY(0) rotate(0) scale(1)", opacity: "1" },
        },
        "card-flip": {
          "0%": { transform: "rotateY(180deg)" },
          "100%": { transform: "rotateY(0deg)" },
        },
        "chip-pop": {
          "0%": { transform: "scale(0) rotate(-180deg)", opacity: "0" },
          "70%": { transform: "scale(1.15) rotate(10deg)", opacity: "1" },
          "100%": { transform: "scale(1) rotate(0)", opacity: "1" },
        },
        "glow-breathe": {
          "0%, 100%": { boxShadow: "0 0 16px hsl(267 100% 55% / 0.5), 0 0 32px hsl(267 100% 55% / 0.25)" },
          "50%": { boxShadow: "0 0 28px hsl(267 100% 60% / 0.85), 0 0 60px hsl(267 100% 60% / 0.45)" },
        },
        "neon-flicker": {
          "0%, 100%": { textShadow: "0 0 8px currentColor, 0 0 20px currentColor" },
          "50%": { textShadow: "0 0 14px currentColor, 0 0 30px currentColor, 0 0 60px currentColor" },
        },
        "border-flow": {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
        "spin-slow": { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } },
        "ripple": {
          "0%": { transform: "scale(0.8)", opacity: "0.6" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "scan": "scan 3s linear infinite",
        "scan-x": "scan-x 4s linear infinite",
        "flicker": "flicker 5s linear infinite",
        "slide-up": "slide-up 0.5s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "card-deal": "card-deal 0.5s cubic-bezier(0.16,1,0.3,1) both",
        "card-flip": "card-flip 0.6s ease-out both",
        "chip-pop": "chip-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) both",
        "glow-breathe": "glow-breathe 2.5s ease-in-out infinite",
        "neon-flicker": "neon-flicker 2.4s ease-in-out infinite",
        "border-flow": "border-flow 4s linear infinite",
        "spin-slow": "spin-slow 12s linear infinite",
        "ripple": "ripple 1.2s ease-out infinite",
      },
      backgroundImage: {
        "cyber-gradient": "linear-gradient(135deg, hsl(267 100% 50% / 0.12), hsl(187 100% 50% / 0.12))",
        "neon-gradient": "linear-gradient(90deg, hsl(267 100% 50%), hsl(311 100% 59%), hsl(187 100% 50%))",
        "purple-gradient": "linear-gradient(135deg, hsl(267 100% 50%), hsl(311 100% 59%))",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
