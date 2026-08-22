/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./components/**/*.{vue,js,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./app.vue",
  ],
  theme: {
    extend: {
      colors: {
        noite: "#0B0A1F",
        vitral: "#16143A",
        painel: "#1E1B4B",
        borda: "#2E2A63",
        ouro: "#E9B949",
        rubi: "#C2415C",
        esmeralda: "#2FA98C",
        lilas: "#8E7BE8",
        texto: "#EAE6F7",
        sussurro: "#9A93C4",
      },
      opacity: {
        8: ".08", 12: ".12", 15: ".15", 18: ".18", 22: ".22",
        35: ".35", 45: ".45", 55: ".55", 65: ".65", 85: ".85",
      },
      fontFamily: {
        display: ['"Fraunces"', "Georgia", "serif"],
        corpo: ['"Karla"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
      },
      boxShadow: {
        vitral: "0 0 0 1px rgba(142,123,232,.18), 0 18px 50px -20px rgba(0,0,0,.9)",
        ouro: "0 0 22px -4px rgba(233,185,73,.55)",
      },
      keyframes: {
        acender: {
          "0%": { opacity: "0", transform: "scale(.85)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        pulsoOuro: {
          "0%,100%": { boxShadow: "0 0 0 0 rgba(233,185,73,.35)" },
          "50%": { boxShadow: "0 0 0 10px rgba(233,185,73,0)" },
        },
      },
      animation: {
        acender: "acender .45s cubic-bezier(.2,.9,.3,1.4) both",
        pulsoOuro: "pulsoOuro 2.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
