import { auth } from "~/lib/api";

const publicas = ["/", "/cadastro", "/recuperar"];

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return;
  const sessao = await auth.sessao();
  if (!sessao && !publicas.includes(to.path)) return navigateTo("/");
  if (sessao && (to.path === "/" || to.path === "/cadastro")) return navigateTo("/painel");
});
