/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        ink: "#0D1321",
        space: "#1D2D44",
        slate2: "#3E5C76",
        denim: "#748CAB",
        eggshell: "#F0EBD8",
        background: "#0D1321",
        foreground: "#F0EBD8",
        card: { DEFAULT: "#1D2D44", foreground: "#F0EBD8" },
        popover: { DEFAULT: "#1D2D44", foreground: "#F0EBD8" },
        primary: { DEFAULT: "#3E5C76", foreground: "#F0EBD8" },
        secondary: { DEFAULT: "#1D2D44", foreground: "#F0EBD8" },
        muted: { DEFAULT: "#1D2D44", foreground: "#748CAB" },
        accent: { DEFAULT: "#3E5C76", foreground: "#F0EBD8" },
        destructive: { DEFAULT: "#b04646", foreground: "#F0EBD8" },
        border: "rgba(116,140,171,0.2)",
        input: "rgba(116,140,171,0.25)",
        ring: "#748CAB",
      },
      fontFamily: {
        heading: ["Outfit", "ui-sans-serif", "system-ui"],
        body: ["Manrope", "ui-sans-serif", "system-ui"],
      },
      borderRadius: {
        lg: "1rem",
        md: "0.75rem",
        sm: "0.5rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        glass: "0 8px 32px rgba(0,0,0,0.35)",
        glow: "0 0 24px rgba(62,92,118,0.45)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "fade-up": { "0%": { opacity: 0, transform: "translateY(12px)" }, "100%": { opacity: 1, transform: "translateY(0)" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-up": "fade-up 0.5s ease-out both",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
