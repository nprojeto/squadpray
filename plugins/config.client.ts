import { carregarConfig } from "~/lib/config";

export default defineNuxtPlugin(async () => {
  const base = useRuntimeConfig().app.baseURL || "/";
  await carregarConfig(base);
});
