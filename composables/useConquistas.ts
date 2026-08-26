import { api } from "~/lib/api";

const pendentes = ref<any[]>([]);
const destaque = ref<string | null>(null);
const buscando = ref(false);

export function useConquistas() {
  async function verificar() {
    if (buscando.value) return;
    buscando.value = true;
    try {
      const r: any = await api.conquistas();
      pendentes.value = r.pendentes ?? [];
    } catch { /* silencioso */ }
    finally { buscando.value = false; }
  }

  async function confirmar(codigo: string) {
    try { await api.marcarConquistaVista(codigo); } catch { /* segue */ }
    pendentes.value = pendentes.value.filter((s) => s.codigo !== codigo);
    destaque.value = codigo;
    setTimeout(() => { if (destaque.value === codigo) destaque.value = null; }, 3000);
  }

  return { pendentes, destaque, verificar, confirmar };
}
