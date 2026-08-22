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
        tinta: "rgb(var(--tinta) / <alpha-value>)",
        papel: "rgb(var(--papel) / <alpha-value>)",
        cartao: "rgb(var(--cartao) / <alpha-value>)",
        risco: "rgb(var(--risco) / <alpha-value>)",
        laranja: "#F04E23",
        amarelo: "#F5CE16",
        roxo: "#B07BE8",
        verde: "#1D6B62",
        rosa: "#EE3D8F",
        fumaca: "rgb(var(--fumaca) / <alpha-value>)",
      },
      fontFamily: {
        display: ['"Anton"', "Impact", "sans-serif"],
        corpo: ['"Archivo"', "system-ui", "sans-serif"],
        marca: ['"Caveat"', "cursive"],
        mono: ['"Space Mono"', "monospace"],
      },
      opacity: {
        8: ".08", 12: ".12", 15: ".15", 18: ".18", 22: ".22",
        35: ".35", 45: ".45", 55: ".55", 65: ".65", 85: ".85",
      },
      boxShadow: {
        bloco: "5px 5px 0 rgb(var(--tinta))",
        blocoP: "3px 3px 0 rgb(var(--tinta))",
        adesivo: "0 6px 14px -6px rgba(21,19,16,.45)",
      },
      keyframes: {
        colar: {
          "0%": { opacity: "0", transform: "scale(.8) rotate(-6deg)" },
          "100%": { opacity: "1", transform: "scale(1) rotate(0)" },
        },
        carimbo: {
          "0%,100%": { transform: "rotate(-4deg) scale(1)" },
          "50%": { transform: "rotate(-4deg) scale(1.04)" },
        },
      },
      animation: {
        colar: "colar .4s cubic-bezier(.2,.9,.3,1.5) both",
        carimbo: "carimbo 3s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
