export default defineNuxtConfig({
  compatibilityDate: "2025-01-01",
  devtools: { enabled: false },
  ssr: false, // site estático, roda 100% no navegador (GitHub Pages)

  modules: ["@nuxtjs/tailwindcss"],
  css: ["~/assets/css/main.css"],

  app: {
    // O workflow do GitHub preenche isso sozinho com o nome do repositório
    baseURL: process.env.NUXT_APP_BASE_URL || "/",
    buildAssetsDir: "assets",
    head: {
      title: "SquadPray — streaks de fé em squad",
      htmlAttrs: { lang: "pt-BR" },
      meta: [
        { charset: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "theme-color", content: "#F4F0E2" },
        {
          name: "description",
          content:
            "Oração, leitura bíblica, devocional, jejum, celebração e GDC em squad. O streak só conta quando todos cumprem.",
        },
      ],
      link: [
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Anton&family=Archivo:wght@400;500;600;700;800&family=Caveat:wght@600;700&family=Space+Mono:wght@400;700&display=swap",
        },
      ],
    },
  },

  runtimeConfig: {
    public: {
      supabaseUrl: process.env.NUXT_PUBLIC_SUPABASE_URL || "",
      supabaseAnonKey: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY || "",
    },
  },

  nitro: { prerender: { crawlLinks: false, routes: ["/"] } },
});
